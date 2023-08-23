import Request from "./request";
import makeFloor from "./floor";
import Response, {__exec__} from "./response";
import correctPath from "./correctPath";
import {ZodError, ZodType} from "zod";
import {CheckerExport} from "./checker";
import {AddHooksLifeCycle, HooksLifeCycle, makeHooksLifeCycle} from "./hook";
import {duploConfig} from "./main";
import {ProcessExport} from "./process";
import makeContentTypeParserSystem from "./contentTypeParser";
import makeAbstractRoutesSystem, {AbstractRoute} from "./abstractRoute";


export type DeclareRoute<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends RouteExtractObj = RouteExtractObj,
> = (method: Request["method"], path: string | string[], abstractRoute?: AbstractRoute) => BuilderPatternRoute<request, response, extractObj>;

export interface RouteExtractObj{
	body?: Record<string, ZodType> | ZodType,
	params?: Record<string, ZodType> | ZodType,
	query?: Record<string, ZodType> | ZodType,
	headers?: Record<string, ZodType> | ZodType,
}

export type ErrorExtractFunction<response extends Response> = (response: response, type: keyof RouteExtractObj, index: string, err: ZodError) => void

export type RouteFunction = (request: Request, response: Response) => Promise<void> | void;

export type RoutesObject = Record<
	Request["method"], 
	Record<string, RouteFunction>
>;

export type RoutehandlerFunction<response extends Response> = (floor: ReturnType<typeof makeFloor>, response: response) => void;

export type RouteNotfoundHandlerFunction = (request: Request, response: Response) => void | Promise<void>;
export type RouteErrorHandlerFunction = (request: Request, response: Response, error: Error) => void | Promise<void>;

export type RouteShortAccess<request extends Request, response extends Response> = (floor: ReturnType<typeof makeFloor>, request: request, response: response) => void | Promise<void>;
export type RouteShort<response extends Response> = (floor: ReturnType<typeof makeFloor>, response: response) => void | Promise<void>;

export interface RouteCheckerParams<checkerExport extends CheckerExport, response extends Response>{
	input(pickup: ReturnType<typeof makeFloor>["pickup"]): Parameters<checkerExport["handler"]>[0];
	validate(info: checkerExport["outputInfo"][number], data?: any): boolean;
	catch(response: response, info: checkerExport["outputInfo"][number], data?: any): void;
	output?: (drop: ReturnType<typeof makeFloor>["drop"], info: checkerExport["outputInfo"][number], data?: any) => void;
	readonly options?: checkerExport["options"];
}

export interface RouteProcessParams<processExport extends ProcessExport>{
	options?: processExport["options"],
	pickup?: processExport["drop"],
	input?: processExport["input"],
}

export interface BuilderPatternRoute<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends RouteExtractObj = RouteExtractObj,
>{
	hook: AddHooksLifeCycle<BuilderPatternRoute<request, response>>["addHook"];

	access<processExport extends ProcessExport>(
		process: processExport | RouteShortAccess<request, response>, 
		params?: RouteProcessParams<processExport>
	): Omit<BuilderPatternRoute<request, response>, "hook" | "access">;

	extract(
		extractObj: extractObj, 
		error?: ErrorExtractFunction<response>
	): Omit<BuilderPatternRoute<request, response>, "hook" | "extract" | "access">;

	check<checkerExport extends CheckerExport>(
		checker: checkerExport, 
		params: RouteCheckerParams<checkerExport, response>
	): Omit<BuilderPatternRoute<request, response>, "hook" | "extract" | "access">;

	process<processExport extends ProcessExport>(
		process: processExport, 
		params?: RouteProcessParams<processExport>
	): Omit<BuilderPatternRoute<request, response>, "hook" | "extract" | "access">;

	cut(short: RouteShort<response>): Omit<BuilderPatternRoute<request, response>, "hook" | "extract" | "access">;

	handler(handlerFunction: RoutehandlerFunction<response>): void;
}

export default function makeRoutesSystem(
	config: duploConfig, 
	mainHooksLifeCyle: HooksLifeCycle, 
	parseContentTypeBody: ReturnType<typeof makeContentTypeParserSystem>["parseContentTypeBody"]
){
	const routes: RoutesObject = {
		GET: {},
		POST: {},
		PUT: {}, 
		PATCH: {},
		DELETE: {}, 
		OPTIONS: {}, 
		HEAD: {}, 
	};

	const buildedRoutes: Record<string, (path: string) => {routeFunction: RouteFunction, params: Record<string, string>}> = {};

	let notfoundHandlerFunction: RouteNotfoundHandlerFunction;

	//function to set notfound handler with hooklifecycle
	function setNotfoundHandler(notFoundFunction: RouteNotfoundHandlerFunction){
		const launchOnConstructRequest = mainHooksLifeCyle.onConstructRequest.build();
		const launchOnConstructResponse = mainHooksLifeCyle.onConstructResponse.build();
		const launchOnError = mainHooksLifeCyle.onError.build();
		const launchBeforeSend = mainHooksLifeCyle.beforeSend.build();
		const launchAfterSend = mainHooksLifeCyle.afterSend.build();

		notfoundHandlerFunction = async(request: Request, response: Response) => {
			await launchOnConstructRequest(request);
			await launchOnConstructResponse(response);
			
			try {
				try {
					await notFoundFunction(request, response);
				
					response.code(503).info("NO_RESPONSE_SENT").send();
				}
				catch (error){
					if(error instanceof Error){
						launchOnError(request, response, error);
						errorHandlerFunction(request, response, error);
					}
					else throw error;
				}
			} 
			catch (response){
				if(response instanceof Response){
					await launchBeforeSend(request, response);
					response[__exec__]();
					await launchAfterSend(request, response);
				}
				else throw response;
			}
		};
	}

	//set default notfound function
	setNotfoundHandler((request, response) => response.code(404).info("NOTFOUND").send(`${request.method}:${request.path} not found`));

	let errorHandlerFunction: RouteErrorHandlerFunction = (request, response, error) => {
		response.code(500).info("INTERNAL_SERVER_ERROR").send(error.stack);
	};

	const declareRoute: DeclareRoute = (method, path, abstractRoute) => {
		if(path instanceof Array)path = path.map((p) => config.prefix + (abstractRoute?.prefix || "") + correctPath(p));
		else path = [config.prefix + (abstractRoute?.prefix || "") + correctPath(path)];

		const hooksLifeCyle = makeHooksLifeCycle();
		
		//copy global hook and abstract hook
		hooksLifeCyle.onConstructRequest.copySubscriber(
			mainHooksLifeCyle.onConstructRequest.subscribers, 
			abstractRoute?.hooksLifeCyle.onConstructRequest.subscribers || []
		);
		hooksLifeCyle.onConstructResponse.copySubscriber(
			mainHooksLifeCyle.onConstructResponse.subscribers,
			abstractRoute?.hooksLifeCyle.onConstructResponse.subscribers || []
		);
		hooksLifeCyle.beforeParsingBody.copySubscriber(
			mainHooksLifeCyle.beforeParsingBody.subscribers,
			abstractRoute?.hooksLifeCyle.beforeParsingBody.subscribers || []
		);
		hooksLifeCyle.onError.copySubscriber(
			mainHooksLifeCyle.onError.subscribers,
			abstractRoute?.hooksLifeCyle.onError.subscribers || []
		);
		hooksLifeCyle.beforeSend.copySubscriber(
			mainHooksLifeCyle.beforeSend.subscribers,
			abstractRoute?.hooksLifeCyle.beforeSend.subscribers || []
		);
		hooksLifeCyle.afterSend.copySubscriber(
			mainHooksLifeCyle.afterSend.subscribers,
			abstractRoute?.hooksLifeCyle.afterSend.subscribers || []
		);

		const hook: BuilderPatternRoute["hook"] = (name, hookFunction) => {
			hooksLifeCyle[name].addSubscriber(hookFunction as any);

			return {
				hook,
				extract,
				handler,
				check,
				process,
				cut,
				access,
			};
		};
		
		let grapAccess: any;
		const access: BuilderPatternRoute["access"] = (processExport, params) => {
			if(typeof processExport === "function"){
				grapAccess = processExport;
			}
			else {
				hooksLifeCyle.onConstructRequest.copySubscriber(processExport.hooksLifeCyle.onConstructRequest.subscribers);
				hooksLifeCyle.onConstructResponse.copySubscriber(processExport.hooksLifeCyle.onConstructResponse.subscribers);
				hooksLifeCyle.beforeParsingBody.copySubscriber(processExport.hooksLifeCyle.beforeParsingBody.subscribers);
				hooksLifeCyle.onError.copySubscriber(processExport.hooksLifeCyle.onError.subscribers);
				hooksLifeCyle.beforeSend.copySubscriber(processExport.hooksLifeCyle.beforeSend.subscribers);
				hooksLifeCyle.afterSend.copySubscriber(processExport.hooksLifeCyle.afterSend.subscribers);

				grapAccess = {
					name: processExport.name,
					options: params?.options || processExport?.options,
					input: params?.input || processExport?.input,
					processFunction: processExport.processFunction,
					pickup: params?.pickup,
				};
			}

			return {
				extract,
				handler,
				check,
				process,
				cut,
			};
		};

		const extracted: RouteExtractObj = {};
		let errorExtract: ErrorExtractFunction<Response> = (response, type, index, err) => {
			response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send();
		};
		const extract: BuilderPatternRoute["extract"] = (extractObj, error?) => {
			Object.entries(extractObj).forEach(([index, value]) => {
				extracted[index as keyof RouteExtractObj] = value;
			});
			errorExtract = error || errorExtract;

			return {
				check,
				handler,
				process,
				cut,
			};
		};

		const steps: any[] = [];
		const process: BuilderPatternRoute["process"] = (processExport, params) => {
			steps.push({
				type: "process",
				name: processExport.name,
				options: params?.options || processExport?.options,
				input: params?.input || processExport?.input,
				processFunction: processExport.processFunction,
				pickup: params?.pickup,
			});
			
			hooksLifeCyle.onConstructRequest.copySubscriber(processExport.hooksLifeCyle.onConstructRequest.subscribers);
			hooksLifeCyle.onConstructResponse.copySubscriber(processExport.hooksLifeCyle.onConstructResponse.subscribers);
			hooksLifeCyle.beforeParsingBody.copySubscriber(processExport.hooksLifeCyle.beforeParsingBody.subscribers);
			hooksLifeCyle.onError.copySubscriber(processExport.hooksLifeCyle.onError.subscribers);
			hooksLifeCyle.beforeSend.copySubscriber(processExport.hooksLifeCyle.beforeSend.subscribers);
			hooksLifeCyle.afterSend.copySubscriber(processExport.hooksLifeCyle.afterSend.subscribers);
			
			return {
				check,
				process,
				handler,
				cut,
			};
		};

		const check: BuilderPatternRoute["check"] = (checker, params) => {
			steps.push({
				type: "checker",
				name: checker.name,
				handler: checker.handler,
				options: params.options || checker.options || {},
				input: params.input,
				validate: params.validate,
				catch: params.catch,
				output: params.output,
			});

			return {
				check,
				handler,
				process,
				cut,
			};
		};

		const cut: BuilderPatternRoute["cut"] = (short) => {
			steps.push(short);

			return {
				check,
				handler,
				process,
				cut,
			};
		};

		const handler: BuilderPatternRoute["handler"] = (handlerFunction) => {
			const launchOnConstructRequest = hooksLifeCyle.onConstructRequest.build();
			const launchOnConstructResponse = hooksLifeCyle.onConstructResponse.build();
			const launchBeforeParsingBody = hooksLifeCyle.beforeParsingBody.build();
			const launchOnError = hooksLifeCyle.onError.build();
			const launchBeforeSend = hooksLifeCyle.beforeSend.build();
			const launchAfterSend = hooksLifeCyle.afterSend.build();

			const stringFunction = routeFunctionString(
				handlerFunction.constructor.name === "AsyncFunction",
				spread(
					condition(
						!!abstractRoute,
						() => abstractRouteString(
							abstractRoute?.abstractRouteFunction.constructor.name === "AsyncFunction",
							mapped(
								abstractRoute?.pickup || [],
								(value) => processDrop(value)
							)
						)
					),
					condition(
						!!grapAccess,
						() => typeof grapAccess === "function" ?
							accessFunctionString(grapAccess.constructor.name === "AsyncFunction") :
							accessProcessString(
								(grapAccess as ProcessExport).processFunction.constructor.name === "AsyncFunction",
								!!grapAccess.input,
								mapped(
									grapAccess?.pickup || [],
									(value) => processDrop(value)
								)
							)
					),
					condition(
						Object.keys(extracted).length !== 0,
						() => extractedTry(
							mapped(
								Object.entries(extracted),
								([type, value]) => value instanceof ZodType ?
									extractedType(type) :
									mapped(
										Object.keys(value),
										(key) => extractedTypeKey(type, key)
									)
							)
						)
					),
					condition(
						steps.length !== 0,
						() => startStep(
							mapped(
								steps,
								(step, index) => typeof step === "function" ?
									cutStep(step.constructor.name === "AsyncFunction", index) :
									step.type === "checker" ?
										checkerStep(
											(step as CheckerExport).handler.constructor.name === "AsyncFunction",
											index,
											!!step.output
										) :
										processStep(
											(step as ProcessExport).processFunction.constructor.name === "AsyncFunction",
											index,
											!!step.input,
											mapped(
												step?.pickup || [],
												(value) => processDrop(value)
											)
										)
							)
						)
					),
				)
			);						
					
			const routeFunction = eval(stringFunction).bind({
				steps, 
				extracted, 
				ZodError, 
				makeFloor,
				errorExtract,
				Response,
				Request,
				__exec__,
				handlerFunction,
				errorHandlerFunction,
				config,
				parseContentTypeBody,
				hooks: {
					launchAfterSend,
					launchBeforeParsingBody,
					launchBeforeSend,
					launchOnConstructRequest,
					launchOnConstructResponse,
					launchOnError,
				},
				grapAccess,
				abstractRoute,
			});

			(path as string[]).forEach(p => routes[method][p] = routeFunction);
		};

		return {
			hook,
			access,
			extract,
			check,
			process,
			cut,
			handler,
		};
	};

	const {declareAbstractRoute} = makeAbstractRoutesSystem(declareRoute);

	return {
		declareRoute<
			request extends Request = Request, 
			response extends Response = Response,
			extractObj extends RouteExtractObj = RouteExtractObj,
		>(method: Request["method"], path: string | string[]){
			return declareRoute(method, path) as BuilderPatternRoute<request, response, extractObj>;
		},
		setNotfoundHandler,
		setErrorHandler(errorFunction: RouteErrorHandlerFunction){
			errorHandlerFunction = errorFunction;
		},
		buildRoute(){
			Object.entries(routes).forEach(([method, value]) => {
				let stringFunction = "let result;\n";

				Object.keys(value).forEach((path) => {
					let regex = `/^${(path as string).replace(/\//g, "\\/")}\\/?(?:\\?[^]*)?$/`.replace(
						/\{([a-zA-Z0-9_\-]+)\}/g,
						(match, group1) => `(?<${group1}>[a-zA-Z0-9_\-]+)`
					);

					stringFunction += /* js */`
						result = ${regex}.exec(path);
						if(result !== null) return {
							routeFunction: this.routes["${path}"],
							params: result.groups || {},
						};
					`;

				});

				stringFunction += /* js */` 
					return {
						routeFunction: this.notfoundHandlerFunction,
						params: {},
					};
				`;
				
				buildedRoutes[method] = eval(/* js */`(function(path){${stringFunction}})`).bind({
					routes: routes[method as Request["method"]],
					get notfoundHandlerFunction(){
						return notfoundHandlerFunction;
					}, 
				});
			});
		},
		findRoute(method: Request["method"], path: string){
			if(!buildedRoutes[method]) return {
				routeFunction: notfoundHandlerFunction,
				params: {},
			};
			
			return buildedRoutes[method](path);
		},
		declareAbstractRoute,
		routes,
		buildedRoutes,
	};
}

const routeFunctionString = (async: boolean, block: string) => /* js */`
(
	async function(request, response){
		await this.hooks.launchOnConstructRequest(request);
		await this.hooks.launchOnConstructResponse(response);

		if(/^(?:POST|PUT|PATCH)$/.test(request.method)){
			await this.hooks.launchBeforeParsingBody(request, response);
			if(request.body === undefined)await this.parseContentTypeBody(request);
		}

		try {
			try{
				const floor = this.makeFloor();
				let result;

				${block}

				${async ? "await " : ""}this.handlerFunction(floor, response);

				response.code(503).info("NO_RESPONSE_SENT").send();
			}
			catch(error){
				if(error instanceof Error){
					this.hooks.launchOnError(request, response, error);
					this.errorHandlerFunction(request, response, error);
				}
				else throw error;
			}
		}
		catch(response){
			if(response instanceof this.Response){
				await this.hooks.launchBeforeSend(request, response);
				response[this.__exec__]();
				await this.hooks.launchAfterSend(request, response);
			}
			else throw response;
		}
	}
)
`;

const abstractRouteString = (async: boolean, drop: string) => /* js */`
result = ${async ? "await " : ""}this.abstractRoute.abstractRouteFunction(
	request, 
	response, 
	this.abstractRoute.options,
);

${drop}
`;

const accessFunctionString = (async: boolean) => /* js */`
${async ? "await " : ""}this.grapAccess(floor, request, response);
`;

const accessProcessString = (async: boolean, hasInput: boolean, drop: string) => 
/* js */`
result = ${async ? "await " : ""}this.grapAccess.processFunction(
	request, 
	response, 
	this.grapAccess.options,
	${hasInput ? /* js */"this.grapAccess.input(floor.pickup)" : ""}
);

${drop}
`;

const extractedTry = (block: string) => /* js */`
let currentExtractedType;
let currentExtractedIndex;

try{
	${block}
}
catch(error) {
	if(error instanceof this.ZodError)this.errorExtract(
		response, 
		currentExtractedType, 
		currentExtractedIndex, 
		error,
	);
	else throw error;
}
`;

const extractedType = (type: string) => /* js */`
currentExtractedType = "${type}";
currentExtractedIndex = "";
floor.drop(
	"${type}",
	this.extracted.${type}.parse(request.${type})
);
`;

const extractedTypeKey = (type: string, key: string) => /* js */`
currentExtractedType = "${type}";
currentExtractedIndex = "${key}";
floor.drop(
	"${key}",
	this.extracted.${type}.${key}.parse(request.${type}?.${key})
);
`;

const startStep = (block: string) =>/* js */`
let currentStep;

${block}
`;

const cutStep = (async: boolean, index: number) => /* js */`
currentStep = ${index};
${async ? "await " : ""}this.steps[${index}](floor, response);
`;

const checkerStep = (async: boolean, index: number, hasOutput: boolean) => /* js */`
currentStep = ${index};
result = ${async ? "await " : ""}this.steps[${index}].handler(
	this.steps[${index}].input(floor.pickup),
	(info, data) => ({info, data}),
	this.steps[${index}].options,
);

if(!this.steps[${index}].validate(result.info, result.data))this.steps[${index}].catch(
	response, 
	result.info, 
	result.data,
);

${hasOutput ? /* js */`this.steps[${index}].output(floor.drop, result.info, result.data);` : ""}
`;

const processStep = (async: boolean, index: number, hasInput: boolean, drop: string) => /* js */`
currentStep = ${index};
result = ${async ? "await " : ""}this.steps[${index}].processFunction(
	request, 
	response, 
	this.steps[${index}].options,
	${hasInput ? /* js */`this.steps[${index}].input(floor.pickup)` : ""}
);

${drop}
`;

const processDrop = (key: string) => /* js */`
floor.drop("${key}", result["${key}"]);
`;

export const mapped = <T extends any[]>(arr: T = [] as any, callback: (value: T[0], index: number) => string) => arr.map(callback).join("\n");
export const spread = (...args: string[]) => args.filter(v => !!v).join("\n");
export const condition = (bool: boolean, block: () => string) => bool ? block() : "";
