import {ZodType, ZodError} from "zod";
import {CheckerExport, MapReturnCheckerType, ReturnCheckerType} from "./checker";
import makeFloor, {Floor} from "./floor";
import {AddHooksLifeCycle, HooksLifeCycle, ServerHooksLifeCycle, makeHooksLifeCycle} from "./hook";
import {PickupDropProcess, ProcessExport, ProcessFunction, ProcessHandlerFunction, __exitProcess__} from "./process";
import {DeclareRoute, RouteExtractObj, RouteProcessAccessParams, RouteProcessParams, condition, mapped, spread} from "./route";
import correctPath from "./correctPath";
import {Response} from "./response";
import {Request} from "./request";
import {DescriptionAll, FlatExtract, PromiseOrNot, StepChecker, StepCustom, StepCut, StepProcess} from "./utility";
import makeMergeAbstractRoutesSystem from "./mergeAbstractRoute";

export const __abstractRoute__ = Symbol("abstractRoute");

export interface AbstractRoute<
	options extends Record<string, any> = Record<string, any>,
	floor extends {} = {},
>{
	name: string;
	localPrefix: string;
	fullPrefix: string;
	drop: string[];
	pickup: string[];
	options: options;
	allowExitProcess: boolean;
	hooksLifeCyle: ReturnType<typeof makeHooksLifeCycle>;
	mergeAbstractRoute?: AbstractRoute[];
	parentAbstractRoute?: AbstractRoute;
	access?: AbstractRouteShortAccess<any, any, any, any> | Omit<StepProcess, "type" | "skip">;
	extracted: RouteExtractObj;
	errorExtract: ErrorExtractAbstractRouteFunction<any>;
	steps: (StepChecker | StepProcess | StepCut | StepCustom)[];
	handlerFunction?: AbstractRouteHandlerFunction<any, any>;
	abstractRouteFunction: AbstractRouteFunction;
	params: AbstractRouteParams<any, any, any>;
	descs: DescriptionAll[];
	extends: Record<string, any>;
	stringFunction: string;
	build: (customStringFunction?: string) => void;
}

export type ErrorExtractAbstractRouteFunction<response extends Response> = (response: response, type: keyof RouteExtractObj, index: string, err: ZodError, exitProcess: () => never) => void;

export type AbstractRouteFunction = (request: Request, response: Response, options: any) => Record<string, any> | Promise<Record<string, any>>;

export interface DeclareAbstractRoute<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends RouteExtractObj = RouteExtractObj,
	options extends Record<string, any> = Record<string, any>,
	floor extends {} = {},
>{
	(
		name: string, 
		params?: DeclareAbstractRouteParams<options>, 
		parentAbstractRoute?: AbstractRoute,
		...desc: any[]
	): BuilderPatternAbstractRoute<request, response, extractObj, options, floor>;
}

export type AbstractRouteShortAccess<
	request extends Request, 
	response extends Response,
	returnFloor extends {},
	floor extends {},
> = (floor: Floor<floor>, request: request, response: response, exitProcess: () => never) => PromiseOrNot<returnFloor | undefined | void>;

export interface  DeclareAbstractRouteParams<options extends any>{
	options?: options;
	allowExitProcess?: boolean;
	prefix?: string;
}

export interface AbstractRouteParams<
	drop extends string, 
	pickup extends string, 
	options extends any,
>{
	pickup?: drop[] & pickup[]; 
	options?: Partial<options>;
	ignorePrefix?: boolean;
}

export type AbstractRouteHandlerFunction<
	response extends Response,
	floor extends {},
> = (floor: Floor<floor>, response: response, exitProcess: () => never) => void;

export type AbstractRouteShort<
	response extends Response,
	returnFloor extends {},
	floor extends {},
> = (floor: Floor<floor>, response: response, exitProcess: () => never) => PromiseOrNot<returnFloor | undefined | void>;

export type AbstractRouteCustom<
	request extends Request, 
	response extends Response,
	returnFloor extends {},
	floor extends {},
> = (floor: Floor<floor>, request: request, response: response, exitProcess: () => never) => PromiseOrNot<returnFloor | undefined | void>;

export interface AbstractRouteCheckerParams<
	checkerExport extends CheckerExport, 
	response extends Response,
	floor extends {},
	info extends string,
>{
	input(pickup: Floor<floor>["pickup"]): Parameters<checkerExport["handler"]>[0];
	validate(info: checkerExport["outputInfo"][number], data: ReturnCheckerType<checkerExport>): boolean;
	catch(response: response, info: checkerExport["outputInfo"][number], data: ReturnCheckerType<checkerExport>, exitProcess: () => never): void;
	output?: (drop: Floor<floor>["drop"], info: info, data: ReturnCheckerType<checkerExport, info>) => void;
	options?: checkerExport["options"] | ((pickup: Floor<floor>["pickup"]) => checkerExport["options"]);
	skip?: (pickup: Floor<floor>["pickup"]) => boolean;
}

export interface AbstractRouteUseFunction<
	request extends Request,
	response extends Response,
	extractObj extends RouteExtractObj,
	options extends Record<string, any>,
	floor extends Record<any, any>,
	drop extends string,
>{
	<pickup extends string>(params?: AbstractRouteParams<drop, pickup, options>): AbstractRouteInstance<
		request,
		response,
		extractObj,
		options,
		Pick<floor, pickup extends keyof floor ? pickup : never>
	>;
}

export interface AbstractRouteInstance<
	request extends Request = Request,
	response extends Response = Response,
	extractObj extends RouteExtractObj = RouteExtractObj,
	options extends Record<string, any> = Record<string, any>,
	floor extends {} = {},
>{
	declareRoute<
		req extends Request = request, 
		res extends Response = response,
		extObj extends RouteExtractObj = extractObj,
	>(method: Request["method"], path: string | string[], ...desc: any[]): ReturnType<
		DeclareRoute<
			request & req, 
			response & res, 
			extractObj & extObj,
			floor
		>
	>;

	declareAbstractRoute<
		req extends Request = request, 
		res extends Response = response,
		extObj extends RouteExtractObj = extractObj,
		options extends {} = {},
	>(name: string, params?: DeclareAbstractRouteParams<options>, ...desc: any[]): ReturnType<
		DeclareAbstractRoute<
			request & req, 
			response & res, 
			extractObj & extObj,
			options,
			{options: options} & floor
		>
	>;

	[__abstractRoute__]: AbstractRoute<options, floor>
}

export interface BuilderPatternAbstractRoute<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends RouteExtractObj = RouteExtractObj,
	options extends Record<string, any> = Record<string, any>,
	floor extends {} = {},
>{
	hook: AddHooksLifeCycle<BuilderPatternAbstractRoute<request, response, extractObj, options, floor>, request, response>["addHook"];

	access<
		localFloor extends {},
		processExport extends ProcessExport,
		pickup extends string,
	>(
		process: processExport, 
		params?: RouteProcessAccessParams<processExport, pickup, floor>, 
		...desc: any[]
	): Omit<
		BuilderPatternAbstractRoute<
		request, 
		response, 
		extractObj, 
		options, 
		floor & PickupDropProcess<processExport, pickup>
		>, 
		"hook" | "access"
	>;

	access<
		localFloor extends {},
		processExport extends ProcessExport,
		pickup extends string,
	>(
		process: AbstractRouteShortAccess<request, response, localFloor, floor>, 
		...desc: any[]
	): Omit<BuilderPatternAbstractRoute<request, response, extractObj, options, floor & localFloor>, "hook" | "access">;

	extract<
		localeExtractObj extends Omit<extractObj, "body">,
		localFloor extends FlatExtract<localeExtractObj>
	>(
		extractObj: localeExtractObj,
		error?: ErrorExtractAbstractRouteFunction<response>, 
		...desc: any[]
	): Omit<BuilderPatternAbstractRoute<request, response, extractObj, options, floor & localFloor>, "hook" | "extract" | "access">;

	check<
		checkerExport extends CheckerExport,
		index extends string = never,
		info extends keyof MapReturnCheckerType<checkerExport> = string,
	>(
		checker: checkerExport, 
		params: AbstractRouteCheckerParams<
			checkerExport, 
			response,
			floor & {[Property in index]: ReturnCheckerType<checkerExport, info>},
			info
		>, 
		...desc: any[]
	): Omit<
		BuilderPatternAbstractRoute<
			request, 
			response, 
			extractObj, 
			options, 
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
		BuilderPatternAbstractRoute<
			request, 
			response, 
			extractObj, 
			options, 
			floor & PickupDropProcess<processExport, pickup>
		>, 
		"hook" | "extract" | "access"
	>;

	cut<localFloor extends {}>(
		short: AbstractRouteShort<response, localFloor, floor>, 
		...desc: any[]
	): Omit<BuilderPatternAbstractRoute<request, response, extractObj, options, floor & localFloor>, "hook" | "extract" | "access">;

	custom<localFloor extends {}>(
		customFunction: AbstractRouteCustom<request, response, localFloor, floor>, 
		...desc: any[]
	): Omit<BuilderPatternAbstractRoute<request, response, extractObj, options, floor & localFloor>, "hook" | "extract" | "access">;

	handler(
		handlerFunction: AbstractRouteHandlerFunction<response, floor>, 
		...desc: any[]
	): Pick<BuilderPatternAbstractRoute<request, response, extractObj, options, floor>, "build">;
	
	build<
		drop extends string,
	>(
		drop?: (keyof floor)[] & drop[], 
		...desc: any[]
	): AbstractRouteUseFunction<request, response, extractObj, options, floor, drop>;
}

export type AbstractRoutes = Record<string, AbstractRoute>

export default function makeAbstractRoutesSystem(declareRoute: DeclareRoute, serverHooksLifeCycle: ServerHooksLifeCycle){
	const abstractRoutes: AbstractRoutes = {};
	
	const declareAbstractRoute: DeclareAbstractRoute = (name, declareParams, parentAbstractRoute, ...desc) => {
		const descs: DescriptionAll[] = [];
		if(desc.length !== 0)descs.push({type: "first", descStep: desc});
		
		const hooksLifeCyle = makeHooksLifeCycle();
		if(parentAbstractRoute){
			//copy abstract hook
			hooksLifeCyle.onConstructRequest.copySubscriber(parentAbstractRoute.hooksLifeCyle.onConstructRequest.subscribers);
			hooksLifeCyle.onConstructResponse.copySubscriber(parentAbstractRoute.hooksLifeCyle.onConstructResponse.subscribers);
			hooksLifeCyle.beforeRouteExecution.copySubscriber(parentAbstractRoute.hooksLifeCyle.beforeRouteExecution.subscribers);
			hooksLifeCyle.beforeParsingBody.copySubscriber(parentAbstractRoute.hooksLifeCyle.beforeParsingBody.subscribers);
			hooksLifeCyle.onError.copySubscriber(parentAbstractRoute.hooksLifeCyle.onError.subscribers);
			hooksLifeCyle.beforeSend.copySubscriber(parentAbstractRoute.hooksLifeCyle.beforeSend.subscribers);
			hooksLifeCyle.afterSend.copySubscriber(parentAbstractRoute.hooksLifeCyle.afterSend.subscribers);
		}

		const hook: BuilderPatternAbstractRoute["hook"] = (name, hookFunction) => {
			hooksLifeCyle[name].addSubscriber(hookFunction as any);

			return {
				hook,
				access,
				extract,
				check,
				process,
				cut,
				handler,
				build,
				custom,
			};
		};

		let grapAccess: Omit<StepProcess, "type" | "skip"> | AbstractRouteShortAccess<any, any, any, any> | undefined;
		const access: BuilderPatternAbstractRoute["access"] = (processExport, ...desc) => {
			if(typeof processExport === "function"){
				grapAccess = processExport;
				if(desc.length !== 0)descs.push({
					type: "access", 
					descStep: desc, 
					isShort: true,
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
				build,
				custom,
			};
		};

		const extracted: RouteExtractObj = {};
		let errorExtract: ErrorExtractAbstractRouteFunction<Response> = (response, type, index, err) => {
			response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send();
		};
		const extract: BuilderPatternAbstractRoute<any, any, any, any, any>["extract"] = (extractObj, error, ...desc) => {
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
				build,
				custom,
			};
		};

		const steps: (StepChecker | StepProcess | StepCut | StepCustom)[] = [];
		const process: BuilderPatternAbstractRoute<any, any, any, any, any>["process"] = (processExport, params, ...desc) => {
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
				build,
				custom,
			};
		};

		const check: BuilderPatternAbstractRoute<any, any, any, any, any>["check"] = (checker, params, ...desc) => {
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
				build,
				custom,
			};
		};

		const cut: BuilderPatternAbstractRoute<any, any, any, any, any>["cut"] = (short, ...desc) => {
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
				build,
				custom,
			};
		};

		const custom: BuilderPatternAbstractRoute<any, any, any, any, any>["custom"] = (customFunction, ...desc) => {
			steps.push({
				customFunction,
				type: "custom"
			});

			if(desc.length !== 0)descs.push({
				type: "custom", 
				descStep: desc,
				index: steps.length - 1
			});

			return {
				check,
				handler,
				build,
				process,
				cut,
				custom,
			};
		};

		let grapHandlerFunction: ProcessHandlerFunction<Response, any>;
		const handler: BuilderPatternAbstractRoute<any, any, any, any, any>["handler"] = (handlerFunction, ...desc) => {
			grapHandlerFunction = handlerFunction;

			if(desc.length !== 0)descs.push({
				type: "handler", 
				descStep: desc
			});

			return {
				build
			};
		};

		const build: BuilderPatternAbstractRoute["build"] = (drop, ...desc) => {
			if(desc.length !== 0)descs.push({
				type: "build", 
				descStep: desc
			});

			const abstractRoute: AbstractRoute = {
				name,
				localPrefix: declareParams?.prefix || "",
				fullPrefix: "",
				drop: drop || [],
				pickup: [],
				options: declareParams?.options || {},
				allowExitProcess: !!declareParams?.allowExitProcess,
				hooksLifeCyle,
				parentAbstractRoute,
				access: grapAccess,
				extracted,
				errorExtract,
				steps,
				handlerFunction: grapHandlerFunction,
				abstractRouteFunction: () => ({}),
				params: {},
				descs,
				extends: {},
				stringFunction: "",
				build: (customStringFunction) => {
					if(abstractRoute.parentAbstractRoute)abstractRoute.parentAbstractRoute.build();

					abstractRoute.fullPrefix = (abstractRoute.parentAbstractRoute?.fullPrefix || "") + correctPath(declareParams?.prefix || "");
					
					abstractRoute.steps.forEach(value => 
						value.type === "checker" || value.type === "process" ? value.build() : undefined
					);
					
					abstractRoute.stringFunction = customStringFunction || abstractRoute.stringFunction || abstractRouteFunctionString(
						!!abstractRoute.options,
						exitProcessTry(
							!!abstractRoute.allowExitProcess,
							spread(
								condition(
									!!abstractRoute.parentAbstractRoute,
									() => parentAbstractRouteString(
										abstractRoute.parentAbstractRoute?.abstractRouteFunction.constructor.name === "AsyncFunction",
										mapped(
											abstractRoute.parentAbstractRoute?.pickup || [],
											(value) => processDrop(value)
										)
									)
								),
								condition(
									!!abstractRoute.access,
									() => typeof abstractRoute.access === "function" ?
										accessFunctionString(abstractRoute.access.constructor.name === "AsyncFunction") :
										accessProcessString(
											abstractRoute.access?.processFunction.constructor.name === "AsyncFunction",
											!!abstractRoute.access?.input,
											mapped(
												abstractRoute.access?.pickup || [],
												(value) => processDrop(value)
											)
										)
								),
								condition(
									Object.keys(abstractRoute.extracted).length !== 0,
									() => extractedTry(
										mapped(
											Object.entries(abstractRoute.extracted),
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
									abstractRoute.steps.length !== 0,
									() => mapped(
										abstractRoute.steps,
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
								condition(
									!!abstractRoute.handlerFunction,
									() => handlerFunction(
										abstractRoute.handlerFunction?.constructor.name === "AsyncFunction"
									)
								)
							)
						),
						drop || []
					);

					abstractRoute.abstractRouteFunction = eval(abstractRoute.stringFunction).bind({
						parentAbstractRoute: abstractRoute.parentAbstractRoute,
						access: abstractRoute.access,
						extracted: abstractRoute.extracted,
						errorExtract: abstractRoute.errorExtract,
						steps: abstractRoute.steps,
						handlerFunction: abstractRoute.handlerFunction,
						extends: abstractRoute.extends,

						makeFloor,
						ZodError,
						__exitProcess__,
						exitProcess: abstractRoute.allowExitProcess ?
							() => {throw __exitProcess__;} :
							() => {throw new Error("ExitProcess function is call in abstractRoute who has not 'allowExitProcess' define on true");}
					}); 
				}
			};

			abstractRoute.build();
			abstractRoutes[name] = abstractRoute;
			serverHooksLifeCycle.onDeclareAbstractRoute.syncLaunchSubscriber(abstractRoute);

			return (params) => {
				const subAbstractRoute: AbstractRoute = {
					...abstractRoute,
					params: params || {},
					build: () => {
						Object.entries(abstractRoute).forEach(([key, value]) => 
							["params"].includes(key) || ((subAbstractRoute as any)[key] = value)
						);
						subAbstractRoute.fullPrefix = subAbstractRoute.params.ignorePrefix ? "" : abstractRoute.fullPrefix;
						subAbstractRoute.pickup = subAbstractRoute.params?.pickup || [];
						subAbstractRoute.options = {
							...abstractRoute.options,
							...subAbstractRoute.params?.options,
						};
					}
				};
				subAbstractRoute.build();

				return {
					declareRoute: (method, path, ...desc) => declareRoute(method, path, subAbstractRoute, ...desc) as any,
					declareAbstractRoute: (nameAbstractRoute, optionsAbstractRoute, ...desc) => declareAbstractRoute(nameAbstractRoute, optionsAbstractRoute, subAbstractRoute, ...desc) as any,
					[__abstractRoute__]: subAbstractRoute,
				};
			};
		};

		return {
			hook,
			access,
			extract,
			check,
			process,
			cut,
			handler,
			build,
			custom,
		};
	};

	const {mergeAbstractRoute} = makeMergeAbstractRoutesSystem(declareRoute, declareAbstractRoute, serverHooksLifeCycle, abstractRoutes);
	
	return {
		declareAbstractRoute<
			request extends Request = Request, 
			response extends Response = Response,
			extractObj extends RouteExtractObj = RouteExtractObj,
			options extends Record<string, any> = Record<string, any>,
		>(name: string, params?: DeclareAbstractRouteParams<options>, ...desc: any[]){
			return declareAbstractRoute(name, params, undefined, ...desc) as ReturnType<DeclareAbstractRoute<request, response, extractObj, options, {options: options}>>;
		},
		mergeAbstractRoute, 
		abstractRoutes,
	};
}

const abstractRouteFunctionString = (hasOptions: boolean, block: string, returnArray: string[]) => /* js */`
(
	${(/await/.test(block) ? "async " : "")}function(request, response, options){
		/* first_line */
		/* end_block */
		const floor = this.makeFloor();
		let result;
		${hasOptions ? /* js */`floor.drop("options", ${"options"});` : ""}
		/* after_make_floor */
		/* end_block */
		${block}
		/* before_return */
		/* end_block */
	${condition(
		returnArray.length !== 0,
		() => /* js */`
		return {
			${mapped(returnArray, (key) => /* js */`"${key}": floor.pickup("${key}"),`)}
		}
		`
	)}
		
	}
)
`;

const exitProcessTry = (hasTry: boolean, block: string) => hasTry ? /* js */`
/* before_exit */
/* end_block */
try{
	/* first_line_exit_try */
	/* end_block */
	${block}
}
catch(error){
	/* first_line_exit_catch */
	/* end_block */
	if(error !== this.__exitProcess__) throw error;
}
/* after_exit */
/* end_block */
` : `
${block}
`;

const parentAbstractRouteString = (async: boolean, drop: string) => /* js */`
/* before_abstract_route */
/* end_block */
result = ${async ? "await " : ""}this.parentAbstractRoute.abstractRouteFunction(
	request, 
	response, 
	this.parentAbstractRoute.options,
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
	${hasInput ? /* js */"this.access.input(floor.pickup)" : ""}
);
/* after_access */
/* end_block */
${drop}
/* after_drop_access */
/* end_block */
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
		this.exitProcess,
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
result = ${async ? "await " : ""}this.steps[${index}].cutFunction(floor, response, this.exitProcess);
/* after_step_[${index}] */
/* end_block */
if(result) Object.entries(result).forEach(([index, value]) => floor.drop(index, value));
/* after_drop_step_[${index}] */
/* end_block */
`;

const cutsomStep = (async: boolean, index: number) => /* js */`
/* before_step_[${index}] */
/* end_block */
result = ${async ? "await " : ""}this.steps[${index}].customFunction(floor, request, response, this.exitProcess);
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
	this.exitProcess
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

const handlerFunction = (async: boolean) => /* js */`
/* before_handler */
/* end_block */
${async ? "await " : ""}this.handlerFunction(floor, response, this.exitProcess);
`;
