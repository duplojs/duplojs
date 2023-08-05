import Request from "./request";
import makeFloor from "./floor";
import Response, {__exec__} from "./response";
import correctPath from "./correctPath";
import {ZodError, ZodType} from "zod";
import {Checker, CheckerExport} from "./checker";
import {AddHooksLifeCycle, HooksLifeCycle, makeHooksLifeCycle} from "./hook";
import {duploConfig} from "./main";
import {ProcessExport} from "./process";
import {IncomingMessage, ServerResponse} from "http";
import makeContentTypeParserSystem from "./contentTypeParser";

export type ExtractObj = {
	body?: Record<string, ZodType> | ZodType,
	params?: Record<string, ZodType> | ZodType,
	query?: Record<string, ZodType> | ZodType,
	headers?: Record<string, ZodType> | ZodType,
}
export type ErrorExtractFunction = (response: Response, type: keyof ExtractObj, index: string, err: ZodError) => void

export type RouteFunction = (request: Request, response: Response) => Promise<void> | void;

export type RoutesObject = Record<
	Request["method"], 
	Record<string, RouteFunction>
>;

export type RoutehandlerFunction = (floor: ReturnType<typeof makeFloor>, response: Response) => void;

export type RouteNotfoundHandlerFunction = (request: Request, response: Response) => void | Promise<void>;
export type RouteErrorHandlerFunction = (request: Request, response: Response, error: Error) => void | Promise<void>;

export type RouteShort = (floor: ReturnType<typeof makeFloor>, response: Response) => void | Promise<void>;

export interface BuilderPatternRoute{
	hook: AddHooksLifeCycle<BuilderPatternRoute>["addHook"];
	extract(extractObj: ExtractObj, error?: ErrorExtractFunction): Omit<BuilderPatternRoute, "hook" | "extract">;
	check(checker: CheckerExport): Omit<BuilderPatternRoute, "hook" | "extract">;
	process(processExport: ProcessExport): Omit<BuilderPatternRoute, "hook" | "extract">;
	cut(short: RouteShort): Omit<BuilderPatternRoute, "hook" | "extract">;
	handler(handlerFunction: RoutehandlerFunction): void;
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

	function setNotfoundHandler(notFoundFunction: RouteNotfoundHandlerFunction){
		const launchOnConstructRequest = mainHooksLifeCyle.onConstructRequest.build();
		const launchOnConstructResponse = mainHooksLifeCyle.onConstructResponse.build();
		const launchOnError = mainHooksLifeCyle.onError.build();
		const launchBeforeSend = mainHooksLifeCyle.beforeSend.build();
		const launchAfterSend = mainHooksLifeCyle.afterSend.build();

		notfoundHandlerFunction = async(request: Request, response: Response) => {
			try {
				try {
					await launchOnConstructRequest(request);
					await launchOnConstructResponse(response);

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

	setNotfoundHandler((request, response) => {
		response.code(404).info("NOTFOUND").send(`${request.method}:${request.path} not found`);
	});

	let errorHandlerFunction: RouteErrorHandlerFunction = (request, response, error) => {
		response.code(500).info("INTERNAL_SERVER_ERROR").send(error.stack);
	};

	function declareRoute(method: Request["method"], path: string | string[]){
		if(path instanceof Array)path = path.map((p) => config.prefix + correctPath(p));
		else path = [config.prefix + correctPath(path)];

		const hooksLifeCyle = makeHooksLifeCycle();
		hooksLifeCyle.onConstructRequest.copySubscriber(mainHooksLifeCyle.onConstructRequest.subscribers);
		hooksLifeCyle.onConstructResponse.copySubscriber(mainHooksLifeCyle.onConstructResponse.subscribers);
		hooksLifeCyle.beforeParsingBody.copySubscriber(mainHooksLifeCyle.beforeParsingBody.subscribers);
		hooksLifeCyle.onError.copySubscriber(mainHooksLifeCyle.onError.subscribers);
		hooksLifeCyle.beforeSend.copySubscriber(mainHooksLifeCyle.beforeSend.subscribers);
		hooksLifeCyle.afterSend.copySubscriber(mainHooksLifeCyle.afterSend.subscribers);

		const hook: BuilderPatternRoute["hook"] = (name, hookFunction) => {
			hooksLifeCyle[name].addSubscriber(hookFunction as any);

			return {
				hook,
				extract,
				handler,
				check,
				process,
				cut,
			};
		};

		const extracted: ExtractObj = {};
		let errorExtract: ErrorExtractFunction = (response, type, index, err) => {
			response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send();
		};
		const extract: BuilderPatternRoute["extract"] = (extractObj, error?) => {
			Object.entries(extractObj).forEach(([index, value]) => {
				extracted[index as keyof ExtractObj] = value;
			});
			errorExtract = error || errorExtract;

			return {
				check,
				handler,
				process,
				cut,
			};
		};

		const steps: (CheckerExport | RouteShort | ProcessExport)[] = [];
		const process: BuilderPatternRoute["process"] = (processExport) => {
			steps.push(processExport);
			
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

		const check: BuilderPatternRoute["check"] = (checker) => {
			steps.push(checker);

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
				mainTry(
					errorTry(
						handlerFunction.constructor.name === "AsyncFunction",
						spread(
							condition(
								Object.keys(extracted).length !== 0,
								extractedTry(
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
								startStep(
									mapped(
										steps,
										(step, index) => typeof step === "function" ?
											cutStep(step.constructor.name === "AsyncFunction", index) :
											step.type === "checker" ?
												checkerStep(
													(step as CheckerExport).handler.constructor.name === "AsyncFunction",
													index,
													!!(step as CheckerExport).output
												) :
												processStep(
													(step as ProcessExport).processFunction.constructor.name === "AsyncFunction",
													index,
													!!step.input,
													mapped(
														(step as ProcessExport).pickup,
														(value) => processDrop(value)
													)
												)
									)
								)
							),
						)
					)
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
				get errorHandlerFunction(){
					return errorHandlerFunction;
				},
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
			});

			(path as string[]).forEach(p => routes[method][p] = routeFunction);
		};

		return {
			extract,
			check,
			handler,
			hook,
			process
		};
	}

	return {
		declareRoute,
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
		routes,
		buildedRoutes,
	};
}

const routeFunctionString = (block: string) => /* js */`
(
	async function(request, response){
		await this.hooks.launchOnConstructRequest(request);
		await this.hooks.launchOnConstructResponse(response);

		if(/POST|PUT|PATCH/.test(request.method)){
			await this.hooks.launchBeforeParsingBody(request, response);
			if(request.body === undefined)await this.parseContentTypeBody(request);
		}

		${block}
	}
)
`;

const mainTry = (block: string) => /* js */`
try {
	${block}
}
catch(response){
	if(response instanceof this.Response){
		await this.hooks.launchBeforeSend(request, response);
		response[this.__exec__]();
		await this.hooks.launchAfterSend(request, response);
	}
	else throw response;
}
`;

const errorTry = (async: boolean, block: string) => /* js */`
try{
	const floor = this.makeFloor();

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
let currentChecker;
let result;

${block}
`;

const cutStep = (async: boolean, index: number) => /* js */`
${async ? "await " : ""}this.steps[${index}](floor, response);
`;

const checkerStep = (async: boolean, index: number, hasOutput: boolean) => /* js */`
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
currentChecker = this.steps[${index}].name;
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
export const condition = (bool: boolean, block: string) => bool ? block : "";
