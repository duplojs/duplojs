import {ZodError, ZodType} from "zod";
import {condition, mapped, spread} from "./route";
import {CheckerExport, MapReturnCheckerType, ReturnCheckerType} from "./checker";
import {AddHooksLifeCycle, HooksLifeCycle, ServerHooksLifeCycle, makeHooksLifeCycle} from "./hook";
import makeFloor, {Floor} from "./floor";
import {Request} from "./request";
import {Response} from "./response";
import {DescriptionAll, DescriptionBuild, DescriptionExtracted, DescriptionFirst, DescriptionHandler, DescriptionStep, FlatExtract, PromiseOrNot, StepChecker, StepCustom, StepCut, StepProcess} from "./utility";

export type ErrorExtractProcessFunction<response extends Response> = (response: response, type: keyof ProcessExtractObj, index: string, err: ZodError, exitProcess: () => never) => void;

export type ProcessHandlerFunction<
	response extends Response,
	floor extends {},
> = (floor: Floor<floor>, response: response, exitProcess: () => never) => void;

export type ProcessShort<
	response extends Response,
	returnFloor extends {},
	floor extends {},
> = (floor: Floor<floor>, response: response, exitProcess: () => never) => PromiseOrNot<returnFloor | undefined | void>;

export type ProcessCustom<
	request extends Request, 
	response extends Response,
	returnFloor extends {},
	floor extends {},
> = (floor: Floor<floor>, request: request, response: response, exitProcess: () => never) => PromiseOrNot<returnFloor | undefined | void>;

export type CreateProcess<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends ProcessExtractObj = ProcessExtractObj,
	options extends Record<string, any> = Record<string, any>,
	input extends any = any,
> = (
	name: string, 
	params?: CreateProcessParams<options, input>,
	...desc: any[]
) => BuilderPatternProcess<request, response, extractObj, options, input>;

export interface CreateProcessParams<options extends Record<string, any>, input extends any>{
	options?: options;
	input?: (pickup: ReturnType<typeof makeFloor>["pickup"]) => input;
	allowExitProcess?: boolean;
}

export interface ProcessExtractObj{
	body?: Record<string, ZodType> | ZodType,
	params?: Record<string, ZodType> | ZodType,
	query?: Record<string, ZodType> | ZodType,
	headers?: Record<string, ZodType> | ZodType,
}

export interface ProcessCheckerParams<
	checkerExport extends CheckerExport, 
	response extends Response,
	floor extends {},
	info extends string,
>{
	input(pickup: Floor<floor>["pickup"]): Parameters<checkerExport["handler"]>[0];
	validate(info: checkerExport["outputInfo"][number], data?: ReturnCheckerType<checkerExport>): boolean;
	catch(response: response, info: checkerExport["outputInfo"][number], data: ReturnCheckerType<checkerExport>, exitProcess: () => never): void;
	output?: (drop: Floor<floor>["drop"], info: info, data: ReturnCheckerType<checkerExport, info>) => void;
	options?: checkerExport["options"] | ((pickup: Floor<floor>["pickup"]) => checkerExport["options"]);
	skip?: (pickup: Floor<floor>["pickup"]) => boolean;
}

export interface ProcessProcessParams<
	processExport extends ProcessExport,
	pickup extends string,
	floor extends {},
>{
	options?: processExport["options"] | ((pickup: ReturnType<typeof makeFloor>["pickup"]) => processExport["options"]);
	pickup?: processExport["drop"] & pickup[];
	input?: (pickup: Floor<floor>["pickup"]) => ReturnType<Exclude<processExport["input"], undefined>>;
	skip?: (pickup: Floor<floor>["pickup"]) => boolean;
}

export type PickupDropProcess<
	processExport extends ProcessExport,
	pickup extends string,
> = processExport extends ProcessExport<infer input, infer options, infer extractObj, infer floor>?
	Pick<
		floor, 
		pickup extends keyof floor ? pickup : never
	> : never;

export interface BuilderPatternProcess<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends ProcessExtractObj = ProcessExtractObj,
	options extends Record<string, any> = Record<string, any>,
	input extends any = any,
	floor extends {options: options, input: input} = {options: options, input: input},
>{
	hook: AddHooksLifeCycle<BuilderPatternProcess<request, response, extractObj, options, input, floor>, request, response>["addHook"];

	extract<
		localeExtractObj extends extractObj,
		localFloor extends FlatExtract<localeExtractObj>,
	>(
		extractObj: localeExtractObj, 
		error?: ErrorExtractProcessFunction<response>, 
		...desc: any[]
	): Omit<BuilderPatternProcess<request, response, extractObj, options, input, floor & localFloor>, "hook" | "extract">;

	check<
		checkerExport extends CheckerExport,
		index extends string = never,
		info extends keyof MapReturnCheckerType<checkerExport> = string,
	>(
		checker: checkerExport, 
		params: ProcessCheckerParams<
			checkerExport, 
			response, 
			floor & {[Property in index]: ReturnCheckerType<checkerExport, info>},
			info
		>, 
		...desc: any[]
	): Omit<
		BuilderPatternProcess<
			request, 
			response, 
			extractObj, 
			options, 
			input, 
			floor & {[Property in index]: ReturnCheckerType<checkerExport, info>}
		>, 
		"hook" | "extract"
	>; 

	process<
		processExport extends ProcessExport,
		pickup extends string,
	>(
		process: processExport, 
		params?: ProcessProcessParams<processExport, pickup, floor>, 
		...desc: any[]
	): Omit<
		BuilderPatternProcess<
			request, 
			response, 
			extractObj, 
			options, 
			input, 
			floor & PickupDropProcess<processExport, pickup>
		>, 
		"hook" | "extract"
	>;

	cut<localFloor extends {}>(
		short: ProcessShort<response, localFloor, floor>, 
		...desc: any[]
	): Omit<BuilderPatternProcess<request, response, extractObj, options, input, floor & localFloor>, "hook" | "extract">;

	custom<localFloor extends {}>(
		customFunction: ProcessCustom<request, response, localFloor, floor>, 
		...desc: any[]
	): Omit<BuilderPatternProcess<request, response, extractObj, options, input, floor & localFloor>, "hook" | "extract">;

	handler(
		handlerFunction: ProcessHandlerFunction<response, floor>, 
		...desc: any[]
	): Pick<BuilderPatternProcess<request, response, extractObj, options, input, floor>, "build">;
	
	build<drop extends string>(
		drop?: (keyof floor)[] & drop[], 
		...desc: any[]
	): ProcessExport<input, options, extractObj, floor, drop>;
}

export interface ProcessExport<
	input extends any = any, 
	options extends Record<string, any> = Record<string, any>, 
	extractObj extends ProcessExtractObj = ProcessExtractObj,
	floor extends Record<any, any> = Record<any, any>,
	drop extends string = string,
>{
	name: string;
	options?: options;
	allowExitProcess: boolean;
	drop: drop[];
	hooksLifeCyle: ReturnType<typeof makeHooksLifeCycle>;
	input?: (pickup: ReturnType<typeof makeFloor>["pickup"]) => input;
	extracted: extractObj,
	errorExtract: ErrorExtractProcessFunction<any>;
	steps: (StepChecker | StepProcess | StepCut | StepCustom)[];
	handlerFunction?: ProcessHandlerFunction<any, any>;
	processFunction: ProcessFunction;
	descs: DescriptionAll[],
	extends: Record<string, any>;
	stringFunction: string;
	build: (customStringFunction?: string) => void;
}

export type ProcessFunction = (request: Request, response: Response, options: any, input: any) => Record<string, any> | Promise<Record<string, any>>;

export const __exitProcess__ = Symbol("exitProcess");

export type Processes = Record<string, ProcessExport>;

export default function makeProcessSystem(serverHooksLifeCycle: ServerHooksLifeCycle){
	const processes: Processes = {};

	const createProcess: CreateProcess = (name, createParams, ...desc) => {
		const hooksLifeCyle = makeHooksLifeCycle();

		const hook: BuilderPatternProcess["hook"] = (name, hookFunction) => {
			hooksLifeCyle[name].addSubscriber(hookFunction as any);

			return {
				hook,
				extract,
				check,
				build,
				process,
				cut,
				custom,
				handler,
			};
		};

		const descs: (DescriptionFirst | DescriptionExtracted | DescriptionStep | DescriptionHandler | DescriptionBuild)[] = [];
		if(desc.length !== 0)descs.push({type: "first", descStep: desc});

		const extracted: ProcessExtractObj = {};
		let errorExtract: ErrorExtractProcessFunction<Response> = (response, type, index, err, exitProcess) => {
			response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send();
		};
		const extract: BuilderPatternProcess["extract"] = (extractObj, error?, ...desc) => {
			Object.entries(extractObj).forEach(([index, value]) => {
				extracted[index as keyof ProcessExtractObj] = value;
			});
			errorExtract = error || errorExtract;

			if(desc.length !== 0)descs.push({
				type: "extracted", 
				descStep: desc,
			});

			return {
				handler,
				check,
				build,
				process,
				cut,
				custom,
			};
		};

		const steps: (StepChecker | StepProcess | StepCut | StepCustom)[] = [];
		const process: BuilderPatternProcess<any, any, any, any, any, any>["process"] = (processExport, params, ...desc) => {
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
				build,
				cut,
				custom,
			};
		};

		const check: BuilderPatternProcess<any, any, any, any, any, any>["check"] = (checker, params, ...desc) => {
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
				build,
				process,
				cut,
				custom,
			};
		};

		const cut: BuilderPatternProcess<any, any, any, any, any, any>["cut"] = (short, ...desc) => {
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
				build,
				process,
				cut,
				custom,
			};
		};

		const custom: BuilderPatternProcess<any, any, any, any, any, any>["custom"] = (customFunction, ...desc) => {
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
		const handler: BuilderPatternProcess<any, any, any, any, any, any>["handler"] = (handlerFunction, ...desc) => {
			grapHandlerFunction = handlerFunction;

			if(desc.length !== 0)descs.push({
				type: "handler", 
				descStep: desc
			});

			return {
				build
			};
		};

		const build: BuilderPatternProcess["build"] = (drop, ...desc) => {
			if(desc.length !== 0)descs.push({
				type: "build", 
				descStep: desc
			});

			const processExport: ProcessExport = {
				name,
				options: createParams?.options,
				allowExitProcess: !!createParams?.allowExitProcess,
				drop: drop || [],
				hooksLifeCyle,
				input: createParams?.input,
				extracted,
				errorExtract,
				steps,
				handlerFunction: grapHandlerFunction,
				processFunction: () => ({}),
				descs,
				extends: {},
				stringFunction: "",
				build: (customStringFunction) => {
					processExport.steps.forEach(value => 
						value.type === "checker" || value.type === "process" ? value.build() : undefined
					);

					processExport.stringFunction = customStringFunction || processExport.stringFunction || processFunctionString(
						!!processExport.input,
						!!processExport.options,
						exitProcessTry(
							processExport.allowExitProcess,
							spread(
								condition(
									Object.keys(processExport.extracted).length !== 0,
									() => extractedTry(
										mapped(
											Object.entries(processExport.extracted),
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
									processExport.steps.length !== 0,
									() => mapped(
										processExport.steps,
										(step, index) => step.type === "cut" ?
											cutStep(step.cutFunction.constructor.name === "AsyncFunction", index) :
											step.type === "custom" ?
												cutsomStep(
													step.customFunction.constructor.name === "AsyncFunction",
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
									!!processExport.handlerFunction,
									() => handlerFunction(
										processExport.handlerFunction?.constructor.name === "AsyncFunction"
									)
								)
							)
						),
						drop || []
					);

					processExport.processFunction = eval(processExport.stringFunction).bind({
						extracted: processExport.extracted,
						errorExtract: processExport.errorExtract,
						steps: processExport.steps, 
						handlerFunction: processExport.handlerFunction,
						extends: processExport.extends,

						ZodError,
						makeFloor,
						__exitProcess__,
						exitProcess: processExport.allowExitProcess ?
							() => {throw __exitProcess__;} :
							() => {throw new Error("ExitProcess function is call in Process who has not 'allowExitProcess' define on true");}
					});
				}
			};

			processExport.build();
			processes[name] = processExport;
			serverHooksLifeCycle.onCreateProcess.syncLaunchSubscriber(processExport);
			
			return processExport as any;
		};

		return {
			hook,
			extract,
			check,
			handler,
			process,
			cut,
			custom,
			build,
		};
	};

	return {
		createProcess<
			request extends Request = Request, 
			response extends Response = Response,
			extractObj extends ProcessExtractObj = ProcessExtractObj,
			options extends Record<string, any> = Record<string, any>,
			input extends any = any,
		>(name: string, params?: CreateProcessParams<options, input>, ...desc: any[]){
			return createProcess(name, params, ...desc) as BuilderPatternProcess<request, response, extractObj, options, input>;
		}, 
		processes,
	};
}


const processFunctionString = (hasInput: boolean, hasOptions: boolean, block: string, returnArray: string[]) => /* js */`
(
	${(/await/.test(block) ? "async " : "")}function(request, response, options, input){
		/* first_line */
		/* end_block */
		const floor = this.makeFloor();
		let result;
		${hasInput ? /* js */`floor.drop("input", ${"input"});` : ""}
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
