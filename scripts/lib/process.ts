import {ZodError, ZodType} from "zod";
import {ExtractObj, condition, mapped, spread} from "./route";
import {CheckerExport} from "./checker";
import {AddHooksLifeCycle, makeHooksLifeCycle} from "./hook";
import makeFloor from "./floor";
import Request from "./request";
import Response from "./response";

export type ErrorExtractProcessFunction = (response: Response, type: keyof ExtractObj, index: string, err: ZodError, exitProcess: () => never) => void

export type ProcessHandlerFunction = (floor: ReturnType<typeof makeFloor>, response: Response, exitProcess: () => never) => void;

export type RouteShort = (floor: ReturnType<typeof makeFloor>, response: Response, exitProcess: () => never) => void | Promise<void>;

export type BuildProcessParameters<values extends string, input extends {}, options extends {}> = {
	options?: options,
	drop?: values[],
	input?(pickup: ReturnType<typeof makeFloor>["pickup"]): input,
	allowExitProcess?: boolean,
}

export type ProcessParameters<values extends string, input extends {}, options extends {}> = {
	options?: options,
	pickup?: values[],
	input?: (pickup: ReturnType<typeof makeFloor>["pickup"]) => input,
}

export interface BuilderPatternProcess {
	hook: AddHooksLifeCycle<BuilderPatternProcess>["addHook"];
	extract(extractObj: ExtractObj, error?: ErrorExtractProcessFunction): Omit<BuilderPatternProcess, "hook" | "extract">;
	check(checker: CheckerExport): Omit<BuilderPatternProcess, "hook" | "extract">; 
	process(processExport: ProcessExport): Omit<BuilderPatternProcess, "hook" | "extract">;
	cut(short: RouteShort): Omit<BuilderPatternProcess, "hook" | "extract">;
	handler(handlerFunction: ProcessHandlerFunction): Omit<BuilderPatternProcess, "hook" | "extract" | "check" | "process" | "handler" | "cut">;
	build: ReturnType<ReturnType<typeof makeProcessSystem>["createProcess"]>["build"];
}

export interface Process<values extends string, input extends {}, options extends {}>{
	(processParameter?: ProcessParameters<values, input, options>): ProcessExport;
	use(
		request: Request, 
		response: Response, 
		processParameter?: {
			options?: options,
			pickup?: values[],
			input?: () => input,
		}
	): ReturnType<ProcessFunction>;
}

export type ProcessExport = {
	name: string,
	options?: any,
	processFunction: ProcessFunction,
	pickup?: string[],
	hooksLifeCyle: ReturnType<typeof makeHooksLifeCycle>,
	type: string,
	input?: (pickup: ReturnType<typeof makeFloor>["pickup"]) => any,
}

export type ProcessFunction = (request: Request, response: Response, options: any, input: any) => Record<string, any> | Promise<Record<string, any>>;

export const __exitProcess__ = Symbol("exitProcess");

export default function makeProcessSystem(){
	const extracted: ExtractObj = {};
		
	function createProcess(name: string){
		const hooksLifeCyle = makeHooksLifeCycle();

		const hook: BuilderPatternProcess["hook"] = (name, hookFunction) => {
			hooksLifeCyle[name].addSubscriber(hookFunction as any);

			return {
				hook,
				extract,
				handler,
				check,
				build,
				process,
				cut,
			};
		};

		let errorExtract: ErrorExtractProcessFunction = (response, type, index, err, exitProcess) => {
			response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send();
		};
		const extract: BuilderPatternProcess["extract"] = (extractObj, error?) => {
			Object.entries(extractObj).forEach(([index, value]) => {
				extracted[index as keyof ExtractObj] = value;
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

		const steps: (CheckerExport | RouteShort | ProcessExport)[] = [];
		const process: BuilderPatternProcess["process"] = (processExport) => {
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
				build,
				cut,

			};
		};

		const check: BuilderPatternProcess["check"] = (checker) => {
			steps.push(checker);
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

		let grapHandlerFunction: ProcessHandlerFunction;
		const handler: BuilderPatternProcess["handler"] = (handlerFunction) => {
			grapHandlerFunction = handlerFunction;

			return {
				build
			};
		};

		function build<
			values extends string,
			input extends {},
			options extends {} 
		>(buildProcessParameters?: BuildProcessParameters<values, input, options>){


			const stringFunction = processFunctionString(
				!!buildProcessParameters?.input,
				!!buildProcessParameters?.options,
				exitProcessTry(
					!!buildProcessParameters?.allowExitProcess,
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
						condition(
							!!grapHandlerFunction,
							handlerFunction(
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

			const process: Process<values, input, options> = function(processParameter){
				return {
					name,
					options: processParameter?.options || buildProcessParameters?.options,
					input: processParameter?.input || buildProcessParameters?.input,
					processFunction,
					pickup: processParameter?.pickup,
					hooksLifeCyle,
					type: "process",
				};
			};

			process.use = function(request, response, processParameter){
				return processFunction(
					request, 
					response, 
					processParameter?.options || buildProcessParameters?.options,
					processParameter?.input?.(),
				);
			};

			return process;
		}

		return {
			hook,
			extract,
			check,
			handler,
			process,
			build
		};
	}

	return {
		createProcess
	};
}


const processFunctionString = (hasInput: boolean, hasOptions: boolean, block: string, returnArray: string[]) => /* js */`
(
	${(/await/.test(block) ? "async" : "")} function(request, response, input, options){
		const floor = this.makeFloor();

		${hasInput ? /* js */`floor.drop("input", ${"input"});` : ""}
		${hasOptions ? /* js */`floor.drop("options", ${"options"});` : ""}

		${block}

	${condition(
		returnArray.length !== 0,
		/* js */`
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
		err,
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

const processDrop = (key: string) => /* js */`
floor.drop("${key}", result["${key}"]);
`;

const handlerFunction = (async: boolean) => /* js */`
${async ? "await " : ""}this.grapHandlerFunction(floor, response, this.exitProcess);
`;
