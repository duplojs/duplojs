import {ZodType, ZodError} from "zod";
import {CheckerExport, ReturnCheckerType} from "./checker";
import makeFloor, {Floor} from "./floor";
import {AddHooksLifeCycle, ServerHooksLifeCycle, makeHooksLifeCycle} from "./hook";
import {PickupDropProcess, ProcessExport, ProcessHandlerFunction, __exitProcess__} from "./process";
import {DeclareRoute, RouteExtractObj, RouteProcessParams, RouteStepParamsSkip, condition, mapped, spread} from "./route";
import correctPath from "./correctPath";
import {Response} from "./response";
import {Request} from "./request";
import {AnyFunction, DescriptionAll, FlatExtract, PromiseOrNot, StepChecker, StepCut, StepProcess} from "./utility";
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
	extracted: RouteExtractObj;
	errorExtract: ErrorExtractAbstractRouteFunction<any>;
	steps: (StepChecker | StepProcess | StepCut)[];
	handlerFunction?: AbstractRouteHandlerFunction<any, any>;
	abstractRouteFunction: AbstractRouteFunction;
	params: AbstractRouteParams<any, any, any>;
	descs: DescriptionAll[];
	extends: Record<string, any>;
	stringFunction: string;
	editingFunctions: EditingFunctionAbstractRoute[];
	build: () => void;
}

export type EditingFunctionAbstractRoute = (abstractRoute: AbstractRoute) => void;

export type ErrorExtractAbstractRouteFunction<response extends Response> = (response: response, type: keyof RouteExtractObj, index: string, err: ZodError, exitProcess: () => never) => void;

export type AbstractRouteFunction = (request: Request, response: Response, options: any) => Record<string, any> | Promise<Record<string, any>>;

export interface DeclareAbstractRoute<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends RouteExtractObj = RouteExtractObj,
	options extends {} = {},
	floor extends {} = {},
>{
	(
		name: string, 
		params?: DeclareAbstractRouteParams<options>, 
		parentAbstractRoute?: AbstractRoute,
		...desc: any[]
	): BuilderPatternAbstractRoute<request, response, extractObj, options, floor>;
}

export interface  DeclareAbstractRouteParams<options extends {}>{
	options?: options;
	allowExitProcess?: boolean;
	prefix?: string;
}

export interface AbstractRouteParams<
	drop extends string, 
	pickup extends string, 
	options extends any,
>{
	pickup?: [drop, ...drop[]] & [pickup, ...pickup[]]; 
	options?: Partial<options>;
	ignorePrefix?: boolean;
}

export type AbstractRouteHandlerFunction<
	response extends Response,
	floor extends {},
> = (floor: Floor<floor>, response: response, exitProcess: () => never) => void;

export type AbstractRouteShort<
	request extends Request, 
	response extends Response,
	returnFloor extends {},
	floor extends {},
> = (floor: Floor<floor>, response: response, request: request, exitProcess: () => never) => PromiseOrNot<returnFloor | undefined | void>;

export interface AbstractRouteCheckerParams<
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

export interface AbstractRouteUseFunction<
	request extends Request,
	response extends Response,
	extractObj extends RouteExtractObj,
	options extends {},
	floor extends {},
	drop extends string,
>{
	<pickup extends string>(params?: AbstractRouteParams<drop, pickup, options>, ...desc: any[]): AbstractRouteInstance<
		request,
		response,
		extractObj,
		options,
		Pick<floor & {[-1]?: undefined}, pickup extends keyof floor? pickup : -1>
	>;
}

export interface AbstractRouteInstance<
	request extends Request = Request,
	response extends Response = Response,
	extractObj extends RouteExtractObj = RouteExtractObj,
	options extends {} = {},
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
	options extends {} = {},
	floor extends {} = {},
>{
	hook: AddHooksLifeCycle<BuilderPatternAbstractRoute<request, response, extractObj, options, floor>, request, response>["addHook"];

	extract<
		localeExtractObj extends Omit<extractObj, "body">,
		localFloor extends FlatExtract<localeExtractObj>
	>(
		extractObj: localeExtractObj,
		error?: ErrorExtractAbstractRouteFunction<response>, 
		...desc: any[]
	): Omit<BuilderPatternAbstractRoute<request, response, extractObj, options, floor & localFloor>, "hook" | "extract">;

	check<
		checkerExport extends CheckerExport,
		info extends string,
		skipObj extends {skip?: RouteStepParamsSkip<floor>;},
		index extends string = never,
	>(
		checker: checkerExport, 
		params: AbstractRouteCheckerParams<checkerExport, response, floor, info, index> & skipObj, 
		...desc: any[]
	): Omit<
		BuilderPatternAbstractRoute<
			request, 
			response, 
			extractObj, 
			options, 
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
		BuilderPatternAbstractRoute<
			request, 
			response, 
			extractObj, 
			options, 
			floor & (
				skipObj["skip"] extends AnyFunction ? 
					Partial<PickupDropProcess<processExport, pickup>> :
					PickupDropProcess<processExport, pickup>
			)
		>, 
		"hook" | "extract"
	>;

	cut<localFloor extends {}, drop extends string>(
		short: AbstractRouteShort<request, response, localFloor, floor>,
		drop?: drop[] & Extract<keyof localFloor, string>[],
		...desc: any[]
	): Omit<
		BuilderPatternAbstractRoute<
			request, 
			response, 
			extractObj, 
			options, 
			floor & Pick<localFloor, drop extends keyof localFloor ? drop : never>
		>, 
		"hook" | "extract"
	>;

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
				extract,
				check,
				process,
				cut,
				handler,
				build,
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
			};
		};

		const steps: (StepChecker | StepProcess | StepCut)[] = [];
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
			};
		};

		const check: BuilderPatternAbstractRoute<any, any, any, any, any>["check"] = (checker, params, ...desc) => {
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
				build,
			};
		};

		const cut: BuilderPatternAbstractRoute<any, any, any, any, any>["cut"] = (short, drop, ...desc) => {
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
				build,
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
				extracted,
				errorExtract,
				steps,
				handlerFunction: grapHandlerFunction,
				abstractRouteFunction: () => ({}),
				params: {},
				descs,
				extends: {},
				stringFunction: "",
				editingFunctions: [], 
				build: () => {
					abstractRoute.fullPrefix = (abstractRoute.parentAbstractRoute?.fullPrefix || "") + correctPath(declareParams?.prefix || "");
					
					abstractRoute.steps.forEach(value => 
						value.type === "checker" || value.type === "process" ? value.build() : undefined
					);
					
					abstractRoute.stringFunction = abstractRouteFunctionString(
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

					abstractRoute.editingFunctions.forEach(editingFunction => editingFunction(abstractRoute));

					abstractRoute.abstractRouteFunction = eval(abstractRoute.stringFunction).bind({
						parentAbstractRoute: abstractRoute.parentAbstractRoute,
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

			return (params, ...desc) => {
				const subAbstractRoute: AbstractRoute = {
					...abstractRoute,
					params: params || {},
					descs: desc.length !== 0 ? [{type: "abstract", descStep: desc}] : [],
					build: () => {
						Object.entries(abstractRoute).forEach(([key, value]) => 
							["params", "descs"].includes(key) || ((subAbstractRoute as any)[key] = value)
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
			extract,
			check,
			process,
			cut,
			handler,
			build,
		};
	};

	const {mergeAbstractRoute} = makeMergeAbstractRoutesSystem(declareRoute, declareAbstractRoute, serverHooksLifeCycle, abstractRoutes);
	
	return {
		declareAbstractRoute<
			request extends Request = Request, 
			response extends Response = Response,
			extractObj extends RouteExtractObj = RouteExtractObj,
			options extends {} = {},
		>(name: string, params?: DeclareAbstractRouteParams<options>, ...desc: any[]){
			return (declareAbstractRoute(name, params, undefined, ...desc) as any) as ReturnType<DeclareAbstractRoute<request, response, extractObj, options, {options: options}>>;
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

const cutStep = (async: boolean, index: number, block: string) => /* js */`
/* before_step_[${index}] */
/* end_block */
result = ${async ? "await " : ""}this.steps[${index}].cutFunction(floor, response, request, this.exitProcess);
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
${hasResult && !resultIsArray ? /* js */`if(this.steps[${index}].result !== result.info)this.steps[${index}].catch(response, result.info, result.data, this.exitProcess);` : ""}
${hasResult && resultIsArray ? /* js */`if(!this.steps[${index}].result.includes(result.info))this.steps[${index}].catch(response, result.info, result.data, this.exitProcess);` : ""}

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

const handlerFunction = (async: boolean) => /* js */`
/* before_handler */
/* end_block */
${async ? "await " : ""}this.handlerFunction(floor, response, this.exitProcess);
`;
