import {Request} from "./request";
import makeFloor, {Floor} from "./floor";
import {__exec__, Response} from "./response";
import correctPath from "./correctPath";
import {ZodError, ZodType} from "zod";
import {CheckerExport, MapReturnCheckerType, ReturnCheckerType} from "./checker";
import {AddHooksLifeCycle, HooksLifeCycle, ServerHooksLifeCycle, makeHooksLifeCycle} from "./hook";
import {DuploConfig} from "./main";
import {PickupDropProcess, ProcessExport} from "./process";
import makeContentTypeParserSystem from "./contentTypeParser";
import makeAbstractRoutesSystem, {AbstractRoute, AbstractRouteSubscribers} from "./abstractRoute";
import {FlatExtract, PromiseOrNot, StepChecker, StepCustom, StepCut, StepProcess} from "./utility";


export type DeclareRoute<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends RouteExtractObj = RouteExtractObj,
	floor extends {} = {},
> = (method: Request["method"], path: string | string[], abstractRoute?: AbstractRoute) => BuilderPatternRoute<request, response, extractObj, floor>;

export interface RouteSubscribers{
	path: string[];
	method: string;
	abstractRoute?: AbstractRouteSubscribers;
	hooksLifeCyle: HooksLifeCycle;
	access: RouteShortAccess<any, any, any, any> | {
		type: "process",
		name: string,
		options: unknown,
		pickup?: string[]
	};
	extracted: RouteExtractObj;
	steps: (StepChecker | StepProcess | StepCut | StepCustom)[];
}

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

export type RoutehandlerFunction<
	response extends Response, 
	floor extends {},
> = (floor: Floor<floor>, response: response) => void;

export type RouteNotfoundHandlerFunction = (request: Request, response: Response) => PromiseOrNot<void>;
export type RouteErrorHandlerFunction = (request: Request, response: Response, error: Error) => PromiseOrNot<void>;

export type RouteShortAccess<
	request extends Request, 
	response extends Response, 
	returnFloor extends {},
	floor extends {},
> = (floor: Floor<floor>, request: request, response: response) => PromiseOrNot<returnFloor | undefined | void>;

export type RouteShort<
	response extends Response,
	returnFloor extends {},
	floor extends {},
> = (floor: Floor<floor>, response: response) => PromiseOrNot<returnFloor | undefined | void>;

export type RouteCustom<
	request extends Request, 
	response extends Response,
	returnFloor extends {},
	floor extends {},
> = (floor: Floor<floor>, request: request, response: response) => PromiseOrNot<returnFloor | undefined | void>;

export interface RouteCheckerParams<
	checkerExport extends CheckerExport, 
	response extends Response,
	floor extends {},
	info extends string,
>{
	input(pickup: Floor<floor>["pickup"]): Parameters<checkerExport["handler"]>[0];
	validate(info: checkerExport["outputInfo"][number], data?: ReturnCheckerType<checkerExport>): boolean;
	catch(response: response, info: checkerExport["outputInfo"][number], data?: ReturnCheckerType<checkerExport>): void;
	output?: (drop: Floor<floor>["drop"], info: info, data: ReturnCheckerType<checkerExport, info>) => void;
	options?: checkerExport["options"] | ((pickup: Floor<floor>["pickup"]) => checkerExport["options"]);
	skip?: (pickup: Floor<floor>["pickup"]) => boolean;
}

export interface RouteProcessParams<
	processExport extends ProcessExport,
	pickup extends string,
	floor extends {},
>{
	options?: processExport["options"] | ((pickup: Floor<floor>["pickup"]) => processExport["options"]);
	pickup?: processExport["drop"] & pickup[];
	input?: (pickup: Floor<floor>["pickup"]) => ReturnType<Exclude<processExport["input"], undefined>>;
	skip?: (pickup: Floor<floor>["pickup"]) => boolean;
}

export interface RouteProcessAccessParams<
	processExport extends ProcessExport, 
	pickup extends string,
	floor extends {},
>{
	options?: processExport["options"];
	pickup?: processExport["drop"] & pickup[];
	input?: (pickup: Floor<floor>["pickup"]) => ReturnType<Exclude<processExport["input"], undefined>>;
}

export interface BuilderPatternRoute<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends RouteExtractObj = RouteExtractObj,
	floor extends {} = {},
>{
	hook: AddHooksLifeCycle<BuilderPatternRoute<request, response, extractObj, floor>, request, response>["addHook"];

	access<
		localFloor extends {},
		processExport extends ProcessExport,
		pickup extends string,
	>(
		process: processExport, 
		params?: RouteProcessAccessParams<processExport, pickup, floor>
	): Omit<
		BuilderPatternRoute<
			request, 
			response, 
			extractObj, 
			floor & PickupDropProcess<processExport, pickup>
		>, 
		"hook" | "access"
	>;

	access<
		localFloor extends {},
		processExport extends ProcessExport,
		pickup extends string,
	>(
		process: RouteShortAccess<request, response, localFloor, floor>, 
		params?: never
	): Omit<BuilderPatternRoute<request, response, extractObj, floor & localFloor>, "hook" | "access">;

	extract<
		localeExtractObj extends extractObj,
		localFloor extends FlatExtract<localeExtractObj>
	>(
		extractObj: localeExtractObj, 
		error?: ErrorExtractFunction<response>,
	): Omit<BuilderPatternRoute<request, response, extractObj, floor & localFloor>, "hook" | "extract" | "access">;

	check<
		checkerExport extends CheckerExport,
		index extends string = never,
		info extends keyof MapReturnCheckerType<checkerExport> = string,
	>(
		checker: checkerExport, 
		params: RouteCheckerParams<
			checkerExport, 
			response, 
			floor & {[Property in index]: ReturnCheckerType<checkerExport, info>},
			info
		>
	): Omit<
		BuilderPatternRoute<
			request, 
			response, 
			extractObj, 
			floor & {[Property in index]: ReturnCheckerType<checkerExport, info>}
		>, 
		"hook" | "extract" | "access"
	>;

	process<
		processExport extends ProcessExport,
		pickup extends string,
	>(
		process: processExport, 
		params?: RouteProcessParams<processExport, pickup, floor>
	): Omit<
		BuilderPatternRoute<
			request, 
			response, 
			extractObj, 
			floor & PickupDropProcess<processExport, pickup>
		>
		, 
		"hook" | "extract" | "access"
	>;

	cut<localFloor extends {}>(
		short: RouteShort<response, localFloor, floor>
	): Omit<BuilderPatternRoute<request, response, extractObj, floor & localFloor>, "hook" | "extract" | "access">;

	custom<localFloor extends {}>(
		customFunction: RouteCustom<request, response, localFloor, floor>
	): Omit<BuilderPatternRoute<request, response, extractObj, floor & localFloor>, "hook" | "extract" | "access">;

	handler(handlerFunction: RoutehandlerFunction<response, floor>): void;
}

export default function makeRoutesSystem(
	config: DuploConfig, 
	mainHooksLifeCyle: HooksLifeCycle, 
	serverHooksLifeCycle: ServerHooksLifeCycle,
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
		notfoundHandlerFunction = async(request: Request, response: Response) => {
			request.isFound = false;

			await mainHooksLifeCyle.onConstructRequest.launchSubscriber(request);
			await mainHooksLifeCyle.onConstructResponse.launchSubscriber(response);
			
			try {
				try {
					await mainHooksLifeCyle.beforeRouteExecution.launchSubscriber(request, response);

					await notFoundFunction(request, response);
				
					response.code(503).info("NO_RESPONSE_SENT").send();
				}
				catch (error){
					if(error instanceof Error){
						mainHooksLifeCyle.onError.launchSubscriber(request, response, error);
						errorHandlerFunction(request, response, error);
					}
					else throw error;
				}
			} 
			catch (response){
				if(response instanceof Response){
					await  mainHooksLifeCyle.beforeSend.launchSubscriber(request, response);
					response[__exec__]();
					await mainHooksLifeCyle.afterSend.launchSubscriber(request, response);
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
		hooksLifeCyle.beforeRouteExecution.copySubscriber(
			mainHooksLifeCyle.beforeRouteExecution.subscribers,
			abstractRoute?.hooksLifeCyle.beforeRouteExecution.subscribers || []
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
				custom,
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
				hooksLifeCyle.beforeRouteExecution.copySubscriber(processExport.hooksLifeCyle.beforeRouteExecution.subscribers);
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
				custom,
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
				custom,
			};
		};

		const steps: (StepChecker | StepProcess | StepCut | StepCustom)[] = [];
		const process: BuilderPatternRoute<any, any, any, any>["process"] = (processExport, params) => {
			let options;
			if(
				typeof processExport?.options === "object" && 
				(
					typeof params?.options === "function" ||
					typeof params?.options === "object"
				)
			){
				if(typeof params.options === "function") options = (pickup: any) => ({
					...processExport.options,
					...(params.options as (p: any) => any)(pickup)
				});
				else options = {...processExport.options, ...params.options};
			}
			else options = params?.options || processExport?.options;
			
			steps.push({
				type: "process",
				name: processExport.name,
				options: options,
				input: params?.input || processExport?.input,
				processFunction: processExport.processFunction,
				pickup: params?.pickup,
				extracted: processExport.extracted,
				skip: params?.skip,
			});
			
			hooksLifeCyle.onConstructRequest.copySubscriber(processExport.hooksLifeCyle.onConstructRequest.subscribers);
			hooksLifeCyle.onConstructResponse.copySubscriber(processExport.hooksLifeCyle.onConstructResponse.subscribers);
			hooksLifeCyle.beforeRouteExecution.copySubscriber(processExport.hooksLifeCyle.beforeRouteExecution.subscribers);
			hooksLifeCyle.beforeParsingBody.copySubscriber(processExport.hooksLifeCyle.beforeParsingBody.subscribers);
			hooksLifeCyle.onError.copySubscriber(processExport.hooksLifeCyle.onError.subscribers);
			hooksLifeCyle.beforeSend.copySubscriber(processExport.hooksLifeCyle.beforeSend.subscribers);
			hooksLifeCyle.afterSend.copySubscriber(processExport.hooksLifeCyle.afterSend.subscribers);
			
			return {
				check,
				process,
				handler,
				cut,
				custom,
			};
		};

		const check: BuilderPatternRoute<any, any, any, any>["check"] = (checker, params) => {
			let options;
			if(
				typeof checker?.options === "object" && 
				(
					typeof params?.options === "function" ||
					typeof params?.options === "object"
				)
			){
				if(typeof params.options === "function") options = (pickup: any) => ({
					...checker.options,
					...(params.options as (p: any) => any)(pickup)
				});
				else options = {...checker.options, ...params.options};
			}
			else options = params?.options || checker?.options;

			steps.push({
				type: "checker",
				name: checker.name,
				handler: checker.handler,
				options: options,
				input: params.input,
				validate: params.validate,
				catch: params.catch,
				output: params.output,
				skip: params.skip,
			});

			return {
				check,
				handler,
				process,
				cut,
				custom,
			};
		};

		const cut: BuilderPatternRoute<any, any, any, any>["cut"] = (short) => {
			steps.push({
				type: "cut",
				cutFunction: short,
			});

			return {
				check,
				handler,
				process,
				cut,
				custom,
			};
		};

		const custom: BuilderPatternRoute<any, any, any, any>["custom"] = (customFunction) => {
			steps.push({
				type: "custom",
				customFunction,
			});

			return {
				check,
				handler,
				process,
				cut,
				custom,
			};
		};

		const handler: BuilderPatternRoute<any, any, any, any>["handler"] = (handlerFunction) => {
			const launchOnConstructRequest = hooksLifeCyle.onConstructRequest.build();
			const launchOnConstructResponse = hooksLifeCyle.onConstructResponse.build();
			const beforeRouteExecution = hooksLifeCyle.beforeRouteExecution.build();
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
						!!extracted.body || !!steps.find(value => value?.type === "process" && value.extracted.body),
						() => hookBody()
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
						() => mapped(
							steps,
							(step, index) => step.type === "cut" ?
								cutStep((step.cutFunction as () => {}).constructor.name === "AsyncFunction", index) :
								step.type === "custom" ?
									cutsomStep(
										(step.customFunction as () => {}).constructor.name === "AsyncFunction",
										index
									) :
									step.type === "checker" ?
										skipStep(
											!!step.skip,
											index,
											checkerStep(
												step.handler.constructor.name === "AsyncFunction",
												index,
												!!step.output,
												typeof step.options === "function",
											)
										) :
										skipStep(
											!!step.skip,
											index,
											processStep(
												step.processFunction.constructor.name === "AsyncFunction",
												index,
												!!step.input,
												typeof step.options === "function",
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
					beforeRouteExecution,
				},
				grapAccess,
				abstractRoute,
			});

			(path as string[]).forEach(p => routes[method][p] = routeFunction);

			serverHooksLifeCycle.onDeclareRoute.launchSubscriber({
				path: path as string[],
				method,
				abstractRoute: abstractRoute?.abstractRouteSubscribers,
				hooksLifeCyle,
				access: grapAccess,
				extracted,
				steps: steps,
			});
		};

		return {
			hook,
			access,
			extract,
			check,
			process,
			cut,
			custom,
			handler,
		};
	};

	const {declareAbstractRoute} = makeAbstractRoutesSystem(declareRoute, serverHooksLifeCycle);

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
					// le paterne (?:\\?[^]*)? serre a faire match un url avec des query arg 
					const regex = `/^${(path as string).replace(/\//g, "\\/").replace(/\.?\*/g, ".*")}\\/?(?:\\?[^]*)?$/`.replace(
						/\{([a-zA-Z0-9_\-]+)\}/g,
						(match, group1) => `(?<${group1}>[a-zA-Z0-9_\\-]+)`
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

		try {
			try{
				await this.hooks.beforeRouteExecution(request, response);
				
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
result = ${async ? "await " : ""}this.grapAccess(floor, request, response);

if(result) Object.entries(result).forEach(([index, value]) => floor.drop(index, value));
`;

const accessProcessString = (async: boolean, hasInput: boolean, drop: string) => 
/* js */`
result = ${async ? "await " : ""}this.grapAccess.processFunction(
	request, 
	response, 
	this.grapAccess.options,
	${hasInput ? "this.grapAccess.input(floor.pickup)" : ""}
);

${drop}
`;

const hookBody = () => /* js */`
if(request.body === undefined){
	await this.hooks.launchBeforeParsingBody(request, response);
	if(request.body === undefined)await this.parseContentTypeBody(request);
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
	this.extracted["${type}"].parse(request["${type}"])
);
`;

const extractedTypeKey = (type: string, key: string) => /* js */`
currentExtractedType = "${type}";
currentExtractedIndex = "${key}";
floor.drop(
	"${key}",
	this.extracted["${type}"]["${key}"].parse(request["${type}"]?.["${key}"])
);
`;

const cutStep = (async: boolean, index: number) => /* js */`
result = ${async ? "await " : ""}this.steps[${index}].cutFunction(floor, response);

if(result) Object.entries(result).forEach(([index, value]) => floor.drop(index, value));
`;

const cutsomStep = (async: boolean, index: number) => /* js */`
result = ${async ? "await " : ""}this.steps[${index}].customFunction(floor, request, response);

if(result) Object.entries(result).forEach(([index, value]) => floor.drop(index, value));
`;

const checkerStep = (async: boolean, index: number, hasOutput: boolean, optionsIsFunction: boolean) => /* js */`
result = ${async ? "await " : ""}this.steps[${index}].handler(
	this.steps[${index}].input(floor.pickup),
	(info, data) => ({info, data}),
	${!optionsIsFunction ? /* js */`this.steps[${index}].options` : /* js */`this.steps[${index}].options(floor.pickup)`},
);

if(!this.steps[${index}].validate(result.info, result.data))this.steps[${index}].catch(
	response, 
	result.info, 
	result.data,
);

${hasOutput ? /* js */`this.steps[${index}].output(floor.drop, result.info, result.data);` : ""}
`;

const processStep = (async: boolean, index: number, hasInput: boolean, optionsIsFunction: boolean, drop: string) => /* js */`
result = ${async ? "await " : ""}this.steps[${index}].processFunction(
	request, 
	response, 
	${!optionsIsFunction ? /* js */`this.steps[${index}].options` : /* js */`this.steps[${index}].options(floor.pickup)`},
	${hasInput ? /* js */`this.steps[${index}].input(floor.pickup)` : ""}
);

${drop}
`;

const skipStep = (bool: boolean, index: number, block: string) => bool ? /* js */`
if(!this.steps[${index}].skip(floor.pickup)){
	${block}
}
` : block;

const processDrop = (key: string) => /* js */`
floor.drop("${key}", result["${key}"]);
`;

export const mapped = <T extends any[]>(arr: T = [] as any, callback: (value: T[0], index: number) => string) => arr.map(callback).join("\n");
export const spread = (...args: string[]) => args.filter(v => !!v).join("\n");
export const condition = (bool: boolean, block: () => string) => bool ? block() : "";
