import {ZodError, ZodType} from "zod";
import {condition, mapped, spread} from "./route";
import {CheckerExport} from "./checker";
import {AddHooksLifeCycle, HooksLifeCycle, ServerHooksLifeCycle, makeHooksLifeCycle} from "./hook";
import makeFloor from "./floor";
import {Request} from "./request";
import {Response} from "./response";

export type ErrorExtractProcessFunction<response extends Response> = (response: response, type: keyof ProcessExtractObj, index: string, err: ZodError, exitProcess: () => never) => void;

export type ProcessHandlerFunction<response extends Response> = (floor: ReturnType<typeof makeFloor>, response: response, exitProcess: () => never) => void;

export type ProcessShort<response extends Response> = (floor: ReturnType<typeof makeFloor>, response: response, exitProcess: () => never) => void | Promise<void>;

export interface ProcessSubscribers{
	name: string;
	options: unknown;
	drop?: string[];
	hooksLifeCyle: HooksLifeCycle;
	extracted: ProcessExtractObj;
	steps: Array<
		ProcessShort<Response> | {
			type: "checker" | "process",
			name: string,
			options: unknown,
			pickup?: string[]
		}
	>
	handlerFunction?: ProcessHandlerFunction<any>;
}

export type CreateProcess<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends ProcessExtractObj = ProcessExtractObj,
> = (name: string) => BuilderPatternProcess<request, response, extractObj>;

export interface ProcessExtractObj{
	body?: Record<string, ZodType> | ZodType,
	params?: Record<string, ZodType> | ZodType,
	query?: Record<string, ZodType> | ZodType,
	headers?: Record<string, ZodType> | ZodType,
}

export interface BuildProcessParameters<drop extends string, input extends any, options extends any>{
	options?: options;
	drop?: drop[];
	input?: (pickup: ReturnType<typeof makeFloor>["pickup"]) => input;
	allowExitProcess?: boolean;
}

export interface ProcessCheckerParams<checkerExport extends CheckerExport, response extends Response>{
	input(pickup: ReturnType<typeof makeFloor>["pickup"]): Parameters<checkerExport["handler"]>[0];
	validate(info: checkerExport["outputInfo"][number], data?: any): boolean;
	catch(response: response, info: checkerExport["outputInfo"][number], data: any, exitProcess: () => never): void;
	output?: (drop: ReturnType<typeof makeFloor>["drop"], info: checkerExport["outputInfo"][number], data?: any) => void;
	readonly options?: checkerExport["options"];
	skip?: (pickup: ReturnType<typeof makeFloor>["pickup"]) => boolean;
}

export interface ProcessProcessParams<processExport extends ProcessExport>{
	options?: processExport["options"];
	pickup?: processExport["drop"];
	input?: processExport["input"];
	skip?: (pickup: ReturnType<typeof makeFloor>["pickup"]) => boolean;
}

export interface BuilderPatternProcess<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends ProcessExtractObj = ProcessExtractObj,
>{
	hook: AddHooksLifeCycle<BuilderPatternProcess<request, response, extractObj>, request, response>["addHook"];

	extract(
		extractObj: extractObj, 
		error?: ErrorExtractProcessFunction<response>
	): Omit<BuilderPatternProcess<request, response, extractObj>, "hook" | "extract">;

	check<checkerExport extends CheckerExport>(
		checker: checkerExport, 
		params: ProcessCheckerParams<checkerExport, response>
	): Omit<BuilderPatternProcess<request, response, extractObj>, "hook" | "extract">; 

	process<processExport extends ProcessExport>(
		process: processExport, 
		params?: ProcessProcessParams<processExport>
	): Omit<BuilderPatternProcess<request, response, extractObj>, "hook" | "extract">;

	cut(short: ProcessShort<response>): Omit<BuilderPatternProcess<request, response, extractObj>, "hook" | "extract">;

	handler(handlerFunction: ProcessHandlerFunction<response>): Omit<BuilderPatternProcess<request, response, extractObj>, "hook" | "extract" | "check" | "process" | "handler" | "cut">;
	
	build<drop extends string, input extends any, options extends any>(buildProcessParameters?: BuildProcessParameters<drop, input, options>): ProcessExport<drop, input, options, extractObj>;
}

export interface ProcessExport<drop = string, input = any, options = any, extractObj = ProcessExtractObj>{
	name: string;
	options?: options;
	processFunction: ProcessFunction;
	drop?: drop[];
	hooksLifeCyle: ReturnType<typeof makeHooksLifeCycle>;
	input?: (pickup: ReturnType<typeof makeFloor>["pickup"]) => input;
	extracted: extractObj
}

export type ProcessFunction = (request: Request, response: Response, options: any, input: any) => Record<string, any> | Promise<Record<string, any>>;

export const __exitProcess__ = Symbol("exitProcess");

export default function makeProcessSystem(serverHooksLifeCycle: ServerHooksLifeCycle){
		
	const createProcess: CreateProcess = (name: string) => {
		const extracted: ProcessExtractObj = {};
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
				handler,
			};
		};

		let errorExtract: ErrorExtractProcessFunction<Response> = (response, type, index, err, exitProcess) => {
			response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send();
		};
		const extract: BuilderPatternProcess["extract"] = (extractObj, error?) => {
			Object.entries(extractObj).forEach(([index, value]) => {
				extracted[index as keyof ProcessExtractObj] = value;
			});
			errorExtract = error || errorExtract;

			return {
				handler,
				check,
				build,
				process,
				cut,
			};
		};

		const steps: any[] = [];
		const process: BuilderPatternProcess["process"] = (processExport, params) => {
			steps.push({
				type: "process",
				name: processExport.name,
				options: params?.options || processExport?.options,
				input: params?.input || processExport?.input,
				processFunction: processExport.processFunction,
				pickup: params?.pickup,
				skip: params?.skip,
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
				build,
				cut,

			};
		};

		const check: BuilderPatternProcess["check"] = (checker, params) => {
			steps.push({
				type: "checker",
				name: checker.name,
				handler: checker.handler,
				options: params.options || checker.options || {},
				input: params.input,
				validate: params.validate,
				catch: params.catch,
				output: params.output,
				skip: params.skip,
			});

			return {
				check,
				handler,
				build,
				process,
				cut,
			};
		};

		const cut: BuilderPatternProcess["cut"] = (short) => {
			steps.push(short);

			return {
				check,
				handler,
				build,
				process,
				cut,
			};
		};

		let grapHandlerFunction: ProcessHandlerFunction<Response>;
		const handler: BuilderPatternProcess["handler"] = (handlerFunction) => {
			grapHandlerFunction = handlerFunction;

			return {
				build
			};
		};

		const build: BuilderPatternProcess["build"] = (buildProcessParameters) => {
			const stringFunction = processFunctionString(
				!!buildProcessParameters?.input,
				!!buildProcessParameters?.options,
				exitProcessTry(
					!!buildProcessParameters?.allowExitProcess,
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
							() => startStep(
								mapped(
									steps,
									(step, index) => typeof step === "function" ?
										cutStep(step.constructor.name === "AsyncFunction", index) :
										step.type === "checker" ?
											skipStep(
												!!step.skip,
												index,
												checkerStep(
													(step as CheckerExport).handler.constructor.name === "AsyncFunction",
													index,
													!!step.output
												)
											) :
											skipStep(
												!!step.skip,
												index,
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
				buildProcessParameters?.drop || []
			);
			
			const processFunction: ProcessFunction = eval(stringFunction).bind({
				steps, 
				extracted,
				errorExtract,
				ZodError,
				makeFloor,
				grapHandlerFunction,
				__exitProcess__,
				exitProcess: buildProcessParameters?.allowExitProcess ?
					() => {throw __exitProcess__;} :
					() => {throw new Error("ExitProcess function is call in Process who has not 'allowExitProcess' define on true");}
			});

			serverHooksLifeCycle.onCreateProcess.launchSubscriber({
				name,
				options: buildProcessParameters?.options,
				drop: buildProcessParameters?.drop,
				hooksLifeCyle,
				extracted,
				handlerFunction: grapHandlerFunction,
				steps: steps as any,
			});

			return {
				name,
				options: buildProcessParameters?.options,
				input: buildProcessParameters?.input,
				drop: buildProcessParameters?.drop,
				processFunction,
				hooksLifeCyle,
				extracted,
			};
		};

		return {
			hook,
			extract,
			check,
			handler,
			process,
			cut,
			build,
		};
	};

	return {
		createProcess<
			request extends Request = Request, 
			response extends Response = Response,
			extractObj extends ProcessExtractObj = ProcessExtractObj,
		>(name: string){
			return createProcess(name) as BuilderPatternProcess<request, response, extractObj>;
		}
	};
}


const processFunctionString = (hasInput: boolean, hasOptions: boolean, block: string, returnArray: string[]) => /* js */`
(
	${(/await/.test(block) ? "async " : "")}function(request, response, options, input){
		const floor = this.makeFloor();

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
${async ? "await " : ""}this.steps[${index}](floor, response, this.exitProcess);
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
	this.exitProcess
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
