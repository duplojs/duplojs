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
import {DescriptionAll, FlatExtract, PromiseOrNot, StepChecker, StepCustom, StepCut, StepProcess} from "./utility";

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
	access?: RouteShortAccess<any, any, any, any> | Omit<StepProcess, "type" | "skip">;
	extracted: RouteExtractObj;
	errorExtract: ErrorExtractFunction<any>;
	steps: (StepChecker | StepProcess | StepCut | StepCustom)[];
	handlerFunction: RoutehandlerFunction<any, any>;
	routeFunction: RouteFunction;
	descs: DescriptionAll[];
	extends: Record<string, any>;
	stringFunction: string;
	build: (customStringFunction?: string) => void;
}

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
		params?: RouteProcessAccessParams<processExport, pickup, floor>,
		...desc: any[]
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
		...desc: any[]
	): Omit<BuilderPatternRoute<request, response, extractObj, floor & localFloor>, "hook" | "access">;

	extract<
		localeExtractObj extends extractObj,
		localFloor extends FlatExtract<localeExtractObj>
	>(
		extractObj: localeExtractObj, 
		error?: ErrorExtractFunction<response>,
		...desc: any[]
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
		>,
		...desc: any[]
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
		params?: RouteProcessParams<processExport, pickup, floor>,
		...desc: any[]
	): Omit<
		BuilderPatternRoute<
			request, 
			response, 
			extractObj, 
			floor & PickupDropProcess<processExport, pickup>
		>, 
		"hook" | "extract" | "access"
	>;

	cut<localFloor extends {}>(
		short: RouteShort<response, localFloor, floor>,
		...desc: any[]
	): Omit<BuilderPatternRoute<request, response, extractObj, floor & localFloor>, "hook" | "extract" | "access">;

	custom<localFloor extends {}>(
		customFunction: RouteCustom<request, response, localFloor, floor>,
		...desc: any[]
	): Omit<BuilderPatternRoute<request, response, extractObj, floor & localFloor>, "hook" | "extract" | "access">;

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

	const declareRoute: DeclareRoute = (method, path, abstractRoute, ...desc) => {
		const descs: DescriptionAll[] = [];
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
				access,
				custom,
			};
		};
		
		let grapAccess: Omit<StepProcess, "type" | "skip"> | RouteShortAccess<any, any, any, any> | undefined;
		const access: BuilderPatternRoute["access"] = (processExport, ...desc) => {
			if(typeof processExport === "function"){
				grapAccess = processExport;
				if(desc.length !== 0)descs.push({
					type: "access", 
					descStep: desc, 
					isShort: true
				});
			}
			else {
				hooksLifeCyle.onConstructRequest.copySubscriber(processExport.hooksLifeCyle.onConstructRequest.subscribers);
				hooksLifeCyle.onConstructResponse.copySubscriber(processExport.hooksLifeCyle.onConstructResponse.subscribers);
				hooksLifeCyle.beforeRouteExecution.copySubscriber(processExport.hooksLifeCyle.beforeRouteExecution.subscribers);
				hooksLifeCyle.beforeParsingBody.copySubscriber(processExport.hooksLifeCyle.beforeParsingBody.subscribers);
				hooksLifeCyle.onError.copySubscriber(processExport.hooksLifeCyle.onError.subscribers);
				hooksLifeCyle.beforeSend.copySubscriber(processExport.hooksLifeCyle.beforeSend.subscribers);
				hooksLifeCyle.afterSend.copySubscriber(processExport.hooksLifeCyle.afterSend.subscribers);
				
				const params: RouteProcessAccessParams<any, any, any> = desc.shift() || {};

				grapAccess = {
					name: processExport.name,
					options: undefined,
					input: undefined,
					processFunction: () => {},
					pickup: undefined,
					params,
					build: () => {
						grapAccess = grapAccess as Omit<StepProcess, "type" | "skip">;
						grapAccess.options = {
							...processExport?.options,
							...grapAccess.params.options
						};
						grapAccess.pickup = grapAccess.params.pickup;
						grapAccess.input = grapAccess.params.input || processExport?.input;
						grapAccess.processFunction = processExport.processFunction;
					}
				};

				if(desc.length !== 0)descs.push({
					type: "access", 
					descStep: desc, 
					isShort: false,
				});
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
				custom,
			};
		};

		const steps: (StepChecker | StepProcess | StepCut | StepCustom)[] = [];
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
				custom,
			};
		};

		const check: BuilderPatternRoute<any, any, any, any>["check"] = (checker, params, ...desc) => {
			const step: StepChecker = {
				type: "checker",
				name: checker.name,
				handler: () => {},
				options: undefined,
				input: () => {},
				validate: () => {},
				catch: () => {},
				output: undefined,
				skip: undefined,
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

					step.input = step.params.input;
					step.validate = step.params.validate;
					step.catch = step.params.catch;
					step.output = step.params.output;
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
				custom,
			};
		};

		const cut: BuilderPatternRoute<any, any, any, any>["cut"] = (short, ...desc) => {
			steps.push({
				type: "cut",
				cutFunction: short,
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
				custom,
			};
		};

		const custom: BuilderPatternRoute<any, any, any, any>["custom"] = (customFunction, ...desc) => {
			steps.push({
				type: "custom",
				customFunction,
			});

			if(desc.length !== 0)descs.push({
				type: "custom", 
				descStep: desc,
				index: steps.length - 1
			});

			return {
				check,
				handler,
				process,
				cut,
				custom,
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
				access: grapAccess,
				extracted,
				errorExtract: errorExtract,
				steps,
				handlerFunction,
				routeFunction: () => {},
				descs,
				extends: {},
				stringFunction: "",
				build: (customStringFunction) => {
					if(path instanceof Array)route.path = path.map((p) => config.prefix + (route.abstractRoute?.fullPrefix || "") + correctPath(p));
					else route.path = [config.prefix + (route.abstractRoute?.fullPrefix || "") + correctPath(path)];

					if(route.access && typeof route.access !== "function")route.access.build();

					route.steps.forEach(value => 
						value.type === "checker" || value.type === "process" ? value.build() : undefined
					);

					route.stringFunction = customStringFunction || route.stringFunction || routeFunctionString(
						route.handlerFunction.constructor.name === "AsyncFunction",
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
								!!route.access,
								() => typeof route.access === "function" ?
									accessFunctionString(route.access.constructor.name === "AsyncFunction") :
									accessProcessString(
										route.access?.processFunction.constructor.name === "AsyncFunction",
										!!route.access?.input,
										mapped(
											route.access?.pickup || [],
											(value) => processDrop(value)
										)
									)
							),
							condition(
								!!route.extracted.body,
								() => hookBody()
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

					route.routeFunction = eval(route.stringFunction).bind({
						abstractRoute: route.abstractRoute,
						access: route.access,
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
							beforeRouteExecution: route.hooksLifeCyle.beforeRouteExecution.build(),
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
			access,
			extract,
			check,
			process,
			cut,
			custom,
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
		setNotfoundHandler,
		setErrorHandler(errorFunction: RouteErrorHandlerFunction){
			errorHandlerFunction = errorFunction;
		},
		buildRouter(){
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
		mergeAbstractRoute,
		routes,
		buildedRoutes,
		abstractRoutes,
	};
}

const routeFunctionString = (async: boolean, block: string) => /* js */`
(
	async function(request, response){
		/* first_line */
		/* end_block */

		/* before_hook_on_construct_request */
		/* end_block */
		await this.hooks.launchOnConstructRequest(request);
		/* after_hook_on_construct_request */
		/* end_block */

		/* before_hook_on_construct_response */
		/* end_block */
		await this.hooks.launchOnConstructResponse(response);
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
				await this.hooks.beforeRouteExecution(request, response);
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
					this.hooks.launchOnError(request, response, error);
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
				await this.hooks.launchBeforeSend(request, response);
				/* after_hook_before_send */
				/* end_block */
				response[this.__exec__]();
				/* before_hook_after_send */
				/* end_block */
				await this.hooks.launchAfterSend(request, response);
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

const accessFunctionString = (async: boolean) => /* js */`
/* before_access */
/* end_block */
result = ${async ? "await " : ""}this.access(floor, request, response);
/* after_access */
/* end_block */
if(result) Object.entries(result).forEach(([index, value]) => floor.drop(index, value));
/* after_drop_access */
/* end_block */
`;

const accessProcessString = (async: boolean, hasInput: boolean, drop: string) => /* js */`
/* before_access */
/* end_block */
result = ${async ? "await " : ""}this.access.processFunction(
	request, 
	response, 
	this.access.options,
	${hasInput ? "this.access.input(floor.pickup)" : ""}
);
/* after_access */
/* end_block */
${drop}
/* after_drop_access */
/* end_block */
`;

const hookBody = () => /* js */`
if(request.body === undefined){
	/* before_hook_before_parsing_body */
	/* end_block */
	await this.hooks.launchBeforeParsingBody(request, response);
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

const cutStep = (async: boolean, index: number) => /* js */`
/* before_step_[${index}] */
/* end_block */
result = ${async ? "await " : ""}this.steps[${index}].cutFunction(floor, response);
/* after_step_[${index}] */
/* end_block */
if(result) Object.entries(result).forEach(([index, value]) => floor.drop(index, value));
/* after_drop_step_[${index}] */
/* end_block */
`;

const cutsomStep = (async: boolean, index: number) => /* js */`
/* before_step_[${index}] */
/* end_block */
result = ${async ? "await " : ""}this.steps[${index}].customFunction(floor, request, response);
/* after_step_[${index}] */
/* end_block */
if(result) Object.entries(result).forEach(([index, value]) => floor.drop(index, value));
/* after_drop_step_[${index}] */
/* end_block */
`;

const checkerStep = (async: boolean, index: number, hasOutput: boolean, optionsIsFunction: boolean) => /* js */`
/* before_step_[${index}] */
/* end_block */
result = ${async ? "await " : ""}this.steps[${index}].handler(
	this.steps[${index}].input(floor.pickup),
	(info, data) => ({info, data}),
	${!optionsIsFunction ? /* js */`this.steps[${index}].options` : /* js */`this.steps[${index}].options(floor.pickup)`},
);
/* after_step_[${index}] */
/* end_block */
if(!this.steps[${index}].validate(result.info, result.data))this.steps[${index}].catch(
	response, 
	result.info, 
	result.data,
);

${hasOutput ? /* js */`this.steps[${index}].output(floor.drop, result.info, result.data);` : ""}
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
