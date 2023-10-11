import {ZodType, ZodError} from "zod";
import {CheckerExport, MapReturnCheckerType, ReturnCheckerType} from "./checker";
import makeFloor, {Floor} from "./floor";
import {AddHooksLifeCycle, HooksLifeCycle, ServerHooksLifeCycle, makeHooksLifeCycle} from "./hook";
import {PickupDropProcess, ProcessExport, ProcessHandlerFunction, __exitProcess__} from "./process";
import {DeclareRoute, RouteExtractObj, RouteProcessAccessParams, RouteProcessParams, condition, mapped, spread} from "./route";
import correctPath from "./correctPath";
import {Response} from "./response";
import {Request} from "./request";
import {FlatExtract, PromiseOrNot, StepChecker, StepCustom, StepCut, StepProcess} from "./utility";
import makeMergeAbstractRoutesSystem from "./mergeAbstractRoute";

export const __abstractRoute__ = Symbol("abstractRoute");

export interface AbstractRoute<
	options extends Record<string, any> = Record<string, any>,
	floor extends {} = {},
>{
	prefix: string;
	name: string;
	hooksLifeCyle: ReturnType<typeof makeHooksLifeCycle>;
	pickup: string[];
	options: options;
	abstractRouteFunction: AbstractRouteFunction;
	abstractRouteSubscribers: AbstractRouteSubscribers | AbstractRouteSubscribers[];
	descs: any[]
}

export interface AbstractRouteSubscribers{
	name: string;
	abstractRoute?: AbstractRouteSubscribers | AbstractRouteSubscribers[];
	hooksLifeCyle: HooksLifeCycle;
	access: AbstractRouteShortAccess<any, any, any, any> | {
		type: "process",
		name: string,
		options: unknown,
		pickup?: string[]
	};
	extracted: RouteExtractObj;
	steps: (StepChecker | StepProcess | StepCut | StepCustom)[];
	handlerFunction?: AbstractRouteHandlerFunction<any, any>;
	options?: any;
	drop?: string[];
	pickup?: string[];
	descs: any[];
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
		abstractRoute?: AbstractRoute,
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

export default function makeAbstractRoutesSystem(declareRoute: DeclareRoute, serverHooksLifeCycle: ServerHooksLifeCycle){
	const declareAbstractRoute: DeclareAbstractRoute = (name, declareParams, abstractRoute, ...desc) => {
		const descs = desc;
		if(abstractRoute)descs.push(...abstractRoute.descs);
		
		const hooksLifeCyle = makeHooksLifeCycle();
		if(abstractRoute){
			//copy abstract hook
			hooksLifeCyle.onConstructRequest.copySubscriber(abstractRoute.hooksLifeCyle.onConstructRequest.subscribers);
			hooksLifeCyle.onConstructResponse.copySubscriber(abstractRoute.hooksLifeCyle.onConstructResponse.subscribers);
			hooksLifeCyle.beforeRouteExecution.copySubscriber(abstractRoute.hooksLifeCyle.beforeRouteExecution.subscribers);
			hooksLifeCyle.beforeParsingBody.copySubscriber(abstractRoute.hooksLifeCyle.beforeParsingBody.subscribers);
			hooksLifeCyle.onError.copySubscriber(abstractRoute.hooksLifeCyle.onError.subscribers);
			hooksLifeCyle.beforeSend.copySubscriber(abstractRoute.hooksLifeCyle.beforeSend.subscribers);
			hooksLifeCyle.afterSend.copySubscriber(abstractRoute.hooksLifeCyle.afterSend.subscribers);
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

		let grapAccess: any;
		const access: BuilderPatternAbstractRoute["access"] = (processExport, ...desc) => {
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

				const params = desc.shift();

				grapAccess = {
					name: processExport.name,
					options: {
						...processExport?.options,
						...params?.options
					},
					input: params?.input || processExport?.input,
					processFunction: processExport.processFunction,
					pickup: params?.pickup,
				};

				descs.push(...processExport.descs);
			}

			descs.push(...desc);

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

			descs.push(...desc);

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
			
			descs.push(...desc);

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

			descs.push(...desc);

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

			descs.push(...desc);

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

			descs.push(...desc);

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

			descs.push(...desc);

			return {
				build
			};
		};

		const build: BuilderPatternAbstractRoute["build"] = (drop, ...desc) => {
			const stringFunction = abstractRouteFunctionString(
				!!declareParams?.options,
				exitProcessTry(
					!!declareParams?.allowExitProcess,
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
							)
						),
						condition(
							!!grapHandlerFunction,
							() => handlerFunction(
								grapHandlerFunction.constructor.name === "AsyncFunction"
							)
						)
					)
				),
				drop || []
			);

			const abstractRouteFunction = eval(stringFunction).bind({
				steps, 
				extracted,
				makeFloor,
				errorExtract,
				ZodError,
				grapHandlerFunction,
				grapAccess,
				abstractRoute,
				__exitProcess__,
				exitProcess: declareParams?.allowExitProcess ?
					() => {throw __exitProcess__;} :
					() => {throw new Error("ExitProcess function is call in abstractRoute who has not 'allowExitProcess' define on true");}
			}); 
			
			descs.push(...desc);

			serverHooksLifeCycle.onDeclareAbstractRoute.launchSubscriber({
				name,
				abstractRoute: abstractRoute?.abstractRouteSubscribers,
				hooksLifeCyle,
				access: grapAccess,
				extracted,
				steps: steps,
				handlerFunction: grapHandlerFunction,
				options: declareParams?.options,
				drop: drop,
				descs
			});

			return (params) => {
				const abstractRouteParams = {
					abstractRouteFunction,
					hooksLifeCyle,
					name,
					prefix: params?.ignorePrefix ? "" : ((abstractRoute?.prefix || "") + correctPath(declareParams?.prefix || "")),
					pickup: (params?.pickup || []) as any,
					options: {
						...(declareParams?.options || {}),
						...(params?.options || {}),
					},
					// information défini pour le hook onDeclareRoute
					abstractRouteSubscribers: { 
						name,
						abstractRoute: abstractRoute?.abstractRouteSubscribers,
						hooksLifeCyle,
						access: grapAccess,
						extracted,
						steps: steps,
						handlerFunction: grapHandlerFunction,
						options: params?.options || declareParams?.options || {},
						drop: drop,
						pickup: params?.pickup || [],
						descs
					},
					descs
				};

				return {
					declareRoute: (method, path, ...desc) => declareRoute(method, path, abstractRouteParams, ...desc) as any,
					declareAbstractRoute: (nameAbstractRoute, optionsAbstractRoute, ...desc) => declareAbstractRoute(nameAbstractRoute, optionsAbstractRoute, abstractRouteParams, ...desc) as any,
					[__abstractRoute__]: abstractRouteParams,
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

	const {mergeAbstractRoute} = makeMergeAbstractRoutesSystem(declareRoute, declareAbstractRoute);
	
	return {
		declareAbstractRoute<
			request extends Request = Request, 
			response extends Response = Response,
			extractObj extends RouteExtractObj = RouteExtractObj,
			options extends Record<string, any> = Record<string, any>,
		>(name: string, params?: DeclareAbstractRouteParams<options>){
			return declareAbstractRoute(name, params) as ReturnType<DeclareAbstractRoute<request, response, extractObj, options, {options: options}>>;
		},

		mergeAbstractRoute
	};
}

const abstractRouteFunctionString = (hasOptions: boolean, block: string, returnArray: string[]) => /* js */`
(
	${(/await/.test(block) ? "async " : "")}function(request, response, options){
		const floor = this.makeFloor();
		let result;

		${hasOptions ? /* js */`floor.drop("options", ${"options"});` : ""}

		${block}

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
try{
	${block}
}
catch(error){
	if(error !== this.__exitProcess__) throw error;
}
` : `
${block}
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

const accessProcessString = (async: boolean, hasInput: boolean, drop: string) => /* js */`
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
		this.exitProcess,
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

const startStep = (block: string) =>/* js */`
let currentStep;

${block}
`;

const cutStep = (async: boolean, index: number) => /* js */`
result = ${async ? "await " : ""}this.steps[${index}].cutFunction(floor, response, this.exitProcess);

if(result) Object.entries(result).forEach(([index, value]) => floor.drop(index, value));
`;

const cutsomStep = (async: boolean, index: number) => /* js */`
result = ${async ? "await " : ""}this.steps[${index}].customFunction(floor, request, response, this.exitProcess);

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
	this.exitProcess
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

const handlerFunction = (async: boolean) => /* js */`
${async ? "await " : ""}this.grapHandlerFunction(floor, response, this.exitProcess);
`;
