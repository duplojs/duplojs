import {ZodError, ZodType} from "zod";
import {condition, mapped, spread} from "./route";
import {CheckerExport, MapReturnCheckerType, ReturnCheckerType} from "./checker";
import {AddHooksLifeCycle, HooksLifeCycle, ServerHooksLifeCycle, makeHooksLifeCycle} from "./hook";
import makeFloor, {Floor} from "./floor";
import {Request} from "./request";
import {Response} from "./response";
import {DescriptionBuild, DescriptionExtracted, DescriptionFirst, DescriptionHandler, DescriptionStep, FlatExtract, PromiseOrNot, StepChecker, StepCustom, StepCut, StepProcess} from "./utility";

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
	processFunction: ProcessFunction;
	drop: drop[];
	hooksLifeCyle: ReturnType<typeof makeHooksLifeCycle>;
	input?: (pickup: ReturnType<typeof makeFloor>["pickup"]) => input;
	extracted: extractObj,
	steps: (StepChecker | StepProcess | StepCut | StepCustom)[];
	handlerFunction?: ProcessHandlerFunction<any, any>;
	descs: (DescriptionFirst | DescriptionExtracted | DescriptionStep | DescriptionHandler | DescriptionBuild)[],
}

export type ProcessFunction = (request: Request, response: Response, options: any, input: any) => Record<string, any> | Promise<Record<string, any>>;

export const __exitProcess__ = Symbol("exitProcess");

export default function makeProcessSystem(serverHooksLifeCycle: ServerHooksLifeCycle){
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

			if(desc.length !== 0 || processExport.descs.length !== 0)descs.push({
				type: "process", 
				descStep: desc, 
				desc: processExport.descs,
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

			if(desc.length !== 0 || checker.desc.length !== 0)descs.push({
				type: "checker", 
				descStep: desc, 
				desc: checker.desc, 
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
				desc: [],
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
				desc: [],
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
			const stringFunction = processFunctionString(
				!!createParams?.input,
				!!createParams?.options,
				exitProcessTry(
					!!createParams?.allowExitProcess,
					spread(
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
			
			const processFunction: ProcessFunction = eval(stringFunction).bind({
				steps, 
				extracted,
				errorExtract,
				ZodError,
				makeFloor,
				grapHandlerFunction,
				__exitProcess__,
				exitProcess: createParams?.allowExitProcess ?
					() => {throw __exitProcess__;} :
					() => {throw new Error("ExitProcess function is call in Process who has not 'allowExitProcess' define on true");}
			});

			if(desc.length !== 0)descs.push({
				type: "build", 
				descStep: desc
			});

			const processExport: ProcessExport = {
				name,
				options: createParams?.options,
				processFunction,
				drop: drop || [],
				hooksLifeCyle,
				input: createParams?.input,
				extracted,
				steps,
				handlerFunction: grapHandlerFunction,
				descs,
			};

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
		}
	};
}


const processFunctionString = (hasInput: boolean, hasOptions: boolean, block: string, returnArray: string[]) => /* js */`
(
	${(/await/.test(block) ? "async " : "")}function(request, response, options, input){
		const floor = this.makeFloor();
		let result;

		${hasInput ? /* js */`floor.drop("input", ${"input"});` : ""}
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
