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
import makeAbstractRoutesSystem, {AbstractRoute} from "./abstractRoute";
import {AnyFunction, DescriptionAll, FlatExtract, PromiseOrNot, StepChecker, StepCut, StepProcess} from "./utility";

export type DeclareRoute<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends RouteExtractObj = RouteExtractObj,
	floor extends {} = {},
> = (method: Request["method"], path: string | string[], abstractRoute?: AbstractRoute, ...desc: any[]) => BuilderPatternRoute<request, response, extractObj, floor>;

export interface Route{
	path: string[];
	method: string;
	abstractRoute?: AbstractRoute;
	hooksLifeCyle: HooksLifeCycle;
	extracted: RouteExtractObj;
	errorExtract: ErrorExtractFunction<any>;
	steps: (StepChecker | StepProcess | StepCut)[];
	handlerFunction: RoutehandlerFunction<any, any>;
	routeFunction: RouteFunction;
	descs: DescriptionAll[];
	extends: Record<string, any>;
	stringFunction: string;
	editingFunctions: EditingFunctionRoute[];
	build: () => void;
}

export type EditingFunctionRoute = (route: Route) => void;

export interface RouteExtractObj{
	body?: Record<string, ZodType> | ZodType,
	params?: Record<string, ZodType> | ZodType,
	query?: Record<string, ZodType> | ZodType,
	headers?: Record<string, ZodType> | ZodType,
}

export type ErrorExtractFunction<response extends Response> = (response: response, type: keyof RouteExtractObj, index: string, err: ZodError) => void

export type RouteFunction = (request: Request, response: Response) => Promise<void> | void;

export type RoutesObject = Record<Request["method"], Record<string, Route>>;

export type RoutehandlerFunction<
	response extends Response, 
	floor extends {},
> = (floor: Floor<floor>, response: response) => void;

export type RouteNotfoundHandlerFunction = (request: Request, response: Response) => PromiseOrNot<void>;
export type RouteErrorHandlerFunction = (request: Request, response: Response, error: Error) => PromiseOrNot<void>;

export type RouteShort<
	request extends Request, 
	response extends Response,
	returnFloor extends {},
	floor extends {},
> = (floor: Floor<floor>, response: response, request: request) => PromiseOrNot<returnFloor | undefined | void>;

export type RouteStepParamsSkip<floor extends {}> = (pickup: Floor<floor>["pickup"]) => boolean;

export interface RouteCheckerParams<
	checkerExport extends CheckerExport, 
	response extends Response,
	floor extends {},
	info extends string,
	index extends string,
>{
	input(pickup: Floor<floor>["pickup"]): Parameters<checkerExport["handler"]>[0];
	result?: (info & checkerExport["outputInfo"][number]) | (info[] & checkerExport["outputInfo"]);
	indexing?: index & string;
	catch(response: response, info: checkerExport["outputInfo"][number], data?: ReturnCheckerType<checkerExport>): void;
	options?: Partial<checkerExport["options"]> | ((pickup: Floor<floor>["pickup"]) => Partial<checkerExport["options"]>);
}

export interface RouteProcessParams<
	processExport extends ProcessExport,
	pickup extends string,
	floor extends {},
>{
	options?: Partial<processExport["options"]> | ((pickup: Floor<floor>["pickup"]) => Partial<processExport["options"]>);
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

	extract<
		localeExtractObj extends extractObj,
		localFloor extends FlatExtract<localeExtractObj>
	>(
		extractObj: localeExtractObj, 
		error?: ErrorExtractFunction<response>,
		...desc: any[]
	): Omit<BuilderPatternRoute<request, response, extractObj, floor & localFloor>, "hook" | "extract">;

	check<
		checkerExport extends CheckerExport,
		info extends string,
		skipObj extends {skip?: RouteStepParamsSkip<floor>;},
		index extends string = never,
	>(
		checker: checkerExport, 
		params: RouteCheckerParams<checkerExport, response, floor, info, index> & skipObj,
		...desc: any[]
	): Omit<
		BuilderPatternRoute<
			request, 
			response, 
			extractObj, 
			floor & {
				[Property in index]: skipObj["skip"] extends AnyFunction ? 
					ReturnCheckerType<checkerExport, info> | undefined : 
					ReturnCheckerType<checkerExport, info>
			}
		>, 
		"hook" | "extract"
	>;

	process<
		processExport extends ProcessExport,
		pickup extends string,
		skipObj extends {skip?: RouteStepParamsSkip<floor>;},
	>(
		process: processExport, 
		params?: RouteProcessParams<processExport, pickup, floor> & skipObj,
		...desc: any[]
	): Omit<
		BuilderPatternRoute<
			request, 
			response, 
			extractObj, 
			floor & (
				skipObj["skip"] extends AnyFunction ? 
					Partial<PickupDropProcess<processExport, pickup>> :
					PickupDropProcess<processExport, pickup>
			)
		>, 
		"hook" | "extract"
	>;

	cut<localFloor extends {}, drop extends string>(
		short: RouteShort<request, response, localFloor, floor>,
		drop?: drop[] & Extract<keyof localFloor, string>[],
		...desc: any[]
	): Omit<
		BuilderPatternRoute<
			request, 
			response, 
			extractObj, 
			floor & Pick<localFloor, drop extends keyof localFloor ? drop : never>
		>, 
		"hook" | "extract"
	>;

	handler(handlerFunction: RoutehandlerFunction<response, floor>, ...desc: any[]): Route;
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

	let defaultErrorExtract: ErrorExtractFunction<Response> = (response, type, index, err) => {
		response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send();
	};

	const buildedRoutes: Record<string, (path: string) => {routeFunction: RouteFunction, params: Record<string, string>, matchedPath: string}> = {};

	let notfoundHandlerFunction: RouteNotfoundHandlerFunction = (request, response) => response.code(404).info("NOTFOUND").send(`${request.method}:${request.path} not found`);
	let buildedNotfoundFunction: RouteNotfoundHandlerFunction;
	function buildNotfoundHandler(){
		const onConstructRequest = mainHooksLifeCyle.onConstructRequest.build();
		const onConstructResponse = mainHooksLifeCyle.onConstructResponse.build();
		const beforeRouteExecution = mainHooksLifeCyle.beforeRouteExecution.build();
		const onError = mainHooksLifeCyle.onError.build();
		const beforeSend = mainHooksLifeCyle.beforeSend.build();
		const afterSend = mainHooksLifeCyle.afterSend.build();

		buildedNotfoundFunction = async(request: Request, response: Response) => {
			await onConstructRequest(request);
			await onConstructResponse(response);
			
			try {
				try {
					await beforeRouteExecution(request, response);

					await notfoundHandlerFunction(request, response);
				
					response.code(503).info("NO_RESPONSE_SENT").send();
				}
				catch (error){
					if(error instanceof Error){
						onError(request, response, error);
						errorHandlerFunction(request, response, error);
					}
					else throw error;
				}
			} 
			catch (response){
				if(response instanceof Response){
					await beforeSend(request, response);
					response[__exec__]();
					await afterSend(request, response);
				}
				else throw response;
			}
		};
	}

	let errorHandlerFunction: RouteErrorHandlerFunction = (request, response, error) => {
		response.code(500).info("INTERNAL_SERVER_ERROR").send(error.stack);
	};

	const declareRoute: DeclareRoute = (method, path, abstractRoute, ...desc) => {
		const descs: DescriptionAll[] = [];
		if(abstractRoute)descs.push(...abstractRoute.descs);
		if(desc.length !== 0)descs.push({type: "first", descStep: desc});

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
			};
		};

		const extracted: RouteExtractObj = {};
		let errorExtract = defaultErrorExtract;

		const extract: BuilderPatternRoute["extract"] = (extractObj, error, ...desc) => {
			Object.entries(extractObj).forEach(([index, value]) => {
				extracted[index as keyof RouteExtractObj] = value;
			});
			errorExtract = error || errorExtract;

			if(desc.length !== 0)descs.push({
				type: "extracted", 
				descStep: desc,
			});

			return {
				check,
				handler,
				process,
				cut,
			};
		};

		const steps: (StepChecker | StepProcess | StepCut)[] = [];
		const process: BuilderPatternRoute<any, any, any, any>["process"] = (processExport, params, ...desc) => {
			const step: StepProcess = {
				type: "process",
				name: processExport.name,
				options: undefined,
				input: undefined,
				processFunction: () => {},
				pickup: undefined,
				skip: undefined,
				params: params || {},
				build: () => {
					if(
						typeof processExport?.options === "object" && 
						(
							typeof step.params.options === "function" ||
							typeof step.params.options === "object"
						)
					){
						if(typeof step.params.options === "function") step.options = (pickup: any) => ({
							...processExport.options,
							...(step.params.options as (p: any) => any)(pickup)
						});
						else step.options = {...processExport.options, ...step.params.options};
					}
					else step.options = step.params?.options || processExport?.options;

					step.skip = step.params.skip;
					step.pickup = step.params.pickup;
					step.input = step.params.input || processExport?.input;
					step.processFunction = processExport.processFunction;
				}
			};

			steps.push(step);
			
			hooksLifeCyle.onConstructRequest.copySubscriber(processExport.hooksLifeCyle.onConstructRequest.subscribers);
			hooksLifeCyle.onConstructResponse.copySubscriber(processExport.hooksLifeCyle.onConstructResponse.subscribers);
			hooksLifeCyle.beforeRouteExecution.copySubscriber(processExport.hooksLifeCyle.beforeRouteExecution.subscribers);
			hooksLifeCyle.beforeParsingBody.copySubscriber(processExport.hooksLifeCyle.beforeParsingBody.subscribers);
			hooksLifeCyle.onError.copySubscriber(processExport.hooksLifeCyle.onError.subscribers);
			hooksLifeCyle.beforeSend.copySubscriber(processExport.hooksLifeCyle.beforeSend.subscribers);
			hooksLifeCyle.afterSend.copySubscriber(processExport.hooksLifeCyle.afterSend.subscribers);
			
			if(desc.length !== 0)descs.push({
				type: "process", 
				descStep: desc,
				index: steps.length - 1
			});

			return {
				check,
				process,
				handler,
				cut,
			};
		};

		const check: BuilderPatternRoute<any, any, any, any>["check"] = (checker, params, ...desc) => {
			const step: StepChecker = {
				type: "checker",
				name: checker.name,
				handler: () => {},
				options: undefined,
				input: () => {},
				catch: () => {},
				skip: undefined,
				result: undefined,
				indexing: undefined,
				params: params || {},
				build: () => {
					if(
						typeof checker.options === "object" && 
						(
							typeof step.params.options === "function" ||
							typeof step.params.options === "object"
						)
					){
						if(typeof step.params.options === "function") step.options = (pickup: any) => ({
							...checker.options,
							...(step.params.options as (p: any) => any)(pickup)
						});
						else step.options = {...checker.options, ...step.params.options};
					}
					else step.options = step.params.options || checker?.options;

					step.result = step.params.result;
					step.indexing = step.params.indexing;
					step.input = step.params.input;
					step.catch = step.params.catch;
					step.skip = step.params.skip;
					step.handler = checker.handler;
				},
			};

			steps.push(step);
			
			if(desc.length !== 0)descs.push({
				type: "checker", 
				descStep: desc,
				index: steps.length - 1
			});

			return {
				check,
				handler,
				process,
				cut,
			};
		};

		const cut: BuilderPatternRoute<any, any, any, any>["cut"] = (short, drop, ...desc) => {
			steps.push({
				type: "cut",
				cutFunction: short,
				drop: drop || [],
			});

			if(desc.length !== 0)descs.push({
				type: "cut", 
				descStep: desc,
				index: steps.length - 1
			});

			return {
				check,
				handler,
				process,
				cut,
			};
		};

		const handler: BuilderPatternRoute<any, any, any, any>["handler"] = (handlerFunction, ...desc) => {
			if(desc.length !== 0)descs.push({
				type: "handler", 
				descStep: desc
			});

			const route: Route = {
				path: [],
				method,
				abstractRoute,
				hooksLifeCyle,
				extracted,
				errorExtract: errorExtract,
				steps,
				handlerFunction,
				routeFunction: () => {},
				descs,
				extends: {},
				stringFunction: "",
				editingFunctions: [],
				build: () => {
					if(path instanceof Array)route.path = path.map((p) => config.prefix + (route.abstractRoute?.fullPrefix || "") + correctPath(p));
					else route.path = [config.prefix + (route.abstractRoute?.fullPrefix || "") + correctPath(path)];

					route.steps.forEach(value => 
						value.type === "checker" || value.type === "process" ? value.build() : undefined
					);

					route.stringFunction = routeFunctionString(
						route.handlerFunction.constructor.name === "AsyncFunction",
						!!route.hooksLifeCyle.onConstructRequest.subscribers.length,
						!!route.hooksLifeCyle.onConstructResponse.subscribers.length,
						!!route.hooksLifeCyle.beforeRouteExecution.subscribers.length,
						!!route.hooksLifeCyle.onError.subscribers.length,
						!!route.hooksLifeCyle.beforeSend.subscribers.length,
						!!route.hooksLifeCyle.afterSend.subscribers.length,
						spread(
							condition(
								!!route.abstractRoute,
								() => abstractRouteString(
									route.abstractRoute?.abstractRouteFunction.constructor.name === "AsyncFunction",
									mapped(
										route.abstractRoute?.pickup || [],
										(value) => processDrop(value)
									)
								)
							),
							condition(
								!!route.extracted.body,
								() => hookBody(!!route.hooksLifeCyle.beforeParsingBody.subscribers.length)
							),
							condition(
								Object.keys(route.extracted).length !== 0,
								() => extractedTry(
									mapped(
										Object.entries(route.extracted),
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
								route.steps.length !== 0,
								() => mapped(
									route.steps,
									(step, index) => step.type === "cut" ?
										cutStep(
											(step.cutFunction as () => {}).constructor.name === "AsyncFunction", 
											index,
											mapped(
												step.drop,
												value => processDrop(value)
											)
										) :
										step.type === "checker" ?
											skipStep(
												!!step.skip,
												index,
												checkerStep(
													step.handler.constructor.name === "AsyncFunction",
													index,
													!!step.result,
													Array.isArray(step.result),
													!!step.indexing,
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

					route.editingFunctions.forEach(editingFunction => editingFunction(route));

					route.routeFunction = eval(route.stringFunction).bind({
						abstractRoute: route.abstractRoute,
						extracted: route.extracted, 
						errorExtract: route.errorExtract,
						steps: route.steps, 
						handlerFunction: route.handlerFunction,
						extends: route.extends,

						hooks: {
							launchAfterSend: route.hooksLifeCyle.afterSend.build(),
							launchBeforeParsingBody: hooksLifeCyle.beforeParsingBody.build(),
							launchBeforeSend: route.hooksLifeCyle.beforeSend.build(),
							launchOnConstructRequest: route.hooksLifeCyle.onConstructRequest.build(),
							launchOnConstructResponse: route.hooksLifeCyle.onConstructResponse.build(),
							launchOnError: route.hooksLifeCyle.onError.build(),
							launchBeforeRouteExecution: route.hooksLifeCyle.beforeRouteExecution.build(),
						},
						get errorHandlerFunction(){
							return errorHandlerFunction;
						},
						parseContentTypeBody,

						ZodError, 
						makeFloor,
						Response,
						Request,
						__exec__,
						config,
					});
				}
			};

			route.build();
			serverHooksLifeCycle.beforeBuildRouter.addSubscriber(() => route.path.forEach(p => routes[method][p] = route));
			serverHooksLifeCycle.onDeclareRoute.syncLaunchSubscriber(route);

			return route;
		};

		return {
			hook,
			extract,
			check,
			process,
			cut,
			handler,
		};
	};

	const {declareAbstractRoute, mergeAbstractRoute, abstractRoutes} = makeAbstractRoutesSystem(declareRoute, serverHooksLifeCycle);

	return {
		declareRoute<
			request extends Request = Request, 
			response extends Response = Response,
			extractObj extends RouteExtractObj = RouteExtractObj,
		>(method: Request["method"], path: string | string[], ...desc: any[]){
			return declareRoute(method, path, undefined, ...desc) as BuilderPatternRoute<request, response, extractObj>;
		},
		setNotfoundHandler(notfoundFunction: RouteNotfoundHandlerFunction){
			notfoundHandlerFunction = notfoundFunction;
		},
		setErrorHandler(errorFunction: RouteErrorHandlerFunction){
			errorHandlerFunction = errorFunction;
		},
		setDefaultErrorExtract(errorExtract: ErrorExtractFunction<Response>){
			defaultErrorExtract = errorExtract;
		},
		buildRouter(){
			buildNotfoundHandler();

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
							routeFunction: this.routes["${path}"].routeFunction,
							params: result.groups || {},
							matchedPath: "${path}",
						};
					`;

				});

				stringFunction += /* js */` 
					return {
						routeFunction: this.notfoundHandlerFunction,
						params: {},
						matchedPath: null,
					};
				`;
				
				buildedRoutes[method] = eval(/* js */`(function(path){${stringFunction}})`).bind({
					routes: routes[method as Request["method"]],
					notfoundHandlerFunction: buildedNotfoundFunction, 
				});
			});
		},
		findRoute(method: Request["method"], path: string){
			if(!buildedRoutes[method]) return {
				routeFunction: buildedNotfoundFunction,
				params: {},
				matchedPath: null,
			};
			
			return buildedRoutes[method](path);
		},
		declareAbstractRoute,
		mergeAbstractRoute,
		routes,
		buildedRoutes,
		abstractRoutes,
	};
}

const routeFunctionString = (
	async: boolean, 
	hasHookOnConstructRequest: boolean, 
	hasHookOnConstructResponse: boolean,
	hasHookBeforeRouteExecution: boolean,
	hasHookOnError: boolean,
	hasHookBeforeSend: boolean,
	hasHookAfterSend: boolean,
	block: string, 
) => /* js */`
(
	async function(request, response){
		/* first_line */
		/* end_block */

		/* before_hook_on_construct_request */
		/* end_block */
		${hasHookOnConstructRequest ? "await this.hooks.launchOnConstructRequest(request);" : ""}
		/* after_hook_on_construct_request */
		/* end_block */

		/* before_hook_on_construct_response */
		/* end_block */
		${hasHookOnConstructResponse ? "await this.hooks.launchOnConstructResponse(response);" : ""}
		/* after_hook_on_construct_response */
		/* end_block */

		try {
			/* first_line_first_try */
			/* end_block */
			try{
				/* first_line_second_try */
				/* end_block */

				/* before_hook_before_route_execution */
				/* end_block */
				${hasHookBeforeRouteExecution ? "await this.hooks.launchBeforeRouteExecution(request, response);" : ""}
				/* after_hook_before_route_execution */
				/* end_block */
				const floor = this.makeFloor();
				let result;
				/* after_make_floor */
				/* end_block */
				${block}
				/* before_handler */
				/* end_block */
				${async ? "await " : ""}this.handlerFunction(floor, response);
				/* before_no_respose_sent */
				/* end_block */
				response.code(503).info("NO_RESPONSE_SENT").send();
			}
			catch(error){
				/* first_line_second_catch */
				/* end_block */
				if(error instanceof Error){
					/* before_hook_on_error */
					/* end_block */
					${hasHookOnError ? "await this.hooks.launchOnError(request, response, error);" : ""}
					/* after_hook_on_error */
					/* end_block */
					this.errorHandlerFunction(request, response, error);
				}
				else throw error;
			}
		}
		catch(response){
			/* first_line_first_catch */
			/* end_block */
			if(response instanceof this.Response){
				/* before_hook_before_send */
				/* end_block */
				${hasHookBeforeSend ? "await this.hooks.launchBeforeSend(request, response);" : ""}
				/* after_hook_before_send */
				/* end_block */
				await response[this.__exec__]();
				/* before_hook_after_send */
				/* end_block */
				${hasHookAfterSend ? "await this.hooks.launchAfterSend(request, response);" : ""}
				/* after_hook_after_send */
				/* end_block */
			}
			else throw response;
		}
	}
)
`;

const abstractRouteString = (async: boolean, drop: string) => /* js */`
/* before_abstract_route */
/* end_block */
result = ${async ? "await " : ""}this.abstractRoute.abstractRouteFunction(
	request, 
	response, 
	this.abstractRoute.options,
);
/* after_abstract_route */
/* end_block */
${drop}
/* after_drop_abstract_route */
/* end_block */
`;

const hookBody = (hasHookBeforeParsingBody: boolean) => /* js */`
if(request.body === undefined){
	/* before_hook_before_parsing_body */
	/* end_block */
	${hasHookBeforeParsingBody ? "await this.hooks.launchBeforeParsingBody(request, response);" : ""}
	/* after_hook_before_parsing_body */
	/* end_block */
	if(request.body === undefined)await this.parseContentTypeBody(request);
	/* after_parsing_body */
	/* end_block */
}
`;

const extractedTry = (block: string) => /* js */`
/* before_extracted */
/* end_block */
let currentExtractedType;
let currentExtractedIndex;

try{
	/* first_line_extracted_try */
	/* end_block */
	${block}
}
catch(error) {
	/* first_line_extracted_catch */
	/* end_block */
	if(error instanceof this.ZodError)this.errorExtract(
		response, 
		currentExtractedType, 
		currentExtractedIndex, 
		error,
	);
	else throw error;
}
/* after_extracted */
/* end_block */
`;

const extractedType = (type: string) => /* js */`
/* before_extracted_step_[${type}] */
/* end_block */
currentExtractedType = "${type}";
currentExtractedIndex = "";
floor.drop(
	"${type}",
	this.extracted["${type}"].parse(request["${type}"])
);
/* after_extracted_step_[${type}] */
/* end_block */
`;

const extractedTypeKey = (type: string, key: string) => /* js */`
/* before_extracted_step_[${type}]_[${key}] */
/* end_block */
currentExtractedType = "${type}";
currentExtractedIndex = "${key}";
floor.drop(
	"${key}",
	this.extracted["${type}"]["${key}"].parse(request["${type}"]?.["${key}"])
);
/* after_extracted_step_[${type}]_[${key}] */
/* end_block */
`;

const cutStep = (async: boolean, index: number, block: string) => /* js */`
/* before_step_[${index}] */
/* end_block */
result = ${async ? "await " : ""}this.steps[${index}].cutFunction(floor, response, request);
/* after_step_[${index}] */
/* end_block */
${block}
/* after_drop_step_[${index}] */
/* end_block */
`;

const checkerStep = (async: boolean, index: number, hasResult: boolean, resultIsArray: boolean, hasIndexing: boolean, optionsIsFunction: boolean) => /* js */`
/* before_step_[${index}] */
/* end_block */
result = ${async ? "await " : ""}this.steps[${index}].handler(
	this.steps[${index}].input(floor.pickup),
	(info, data) => ({info, data}),
	${!optionsIsFunction ? /* js */`this.steps[${index}].options` : /* js */`this.steps[${index}].options(floor.pickup)`},
);
/* after_step_[${index}] */
/* end_block */
${hasResult && !resultIsArray ? /* js */`if(this.steps[${index}].result !== result.info)this.steps[${index}].catch(response, result.info, result.data);` : ""}
${hasResult && resultIsArray ? /* js */`if(!this.steps[${index}].result.includes(result.info))this.steps[${index}].catch(response, result.info, result.data);` : ""}

${hasIndexing ? /* js */`floor.drop(this.steps[${index}].indexing, result.data)` : ""}
/* after_drop_step_[${index}] */
/* end_block */
`;

const processStep = (async: boolean, index: number, hasInput: boolean, optionsIsFunction: boolean, drop: string) => /* js */`
/* before_step_[${index}] */
/* end_block */
result = ${async ? "await " : ""}this.steps[${index}].processFunction(
	request, 
	response, 
	${!optionsIsFunction ? /* js */`this.steps[${index}].options` : /* js */`this.steps[${index}].options(floor.pickup)`},
	${hasInput ? /* js */`this.steps[${index}].input(floor.pickup)` : ""}
);
/* after_step_[${index}] */
/* end_block */
${drop}
/* after_drop_step_[${index}] */
/* end_block */
`;

const skipStep = (bool: boolean, index: number, block: string) => bool ? /* js */`
/* before_skip_step_[${index}] */
/* end_block */
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
