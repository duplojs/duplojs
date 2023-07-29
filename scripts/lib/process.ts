import zod, {ZodError} from "zod";
import {errorExtract, extractObj} from "./route";
import {returnCheckerExec, shortChecker} from "./checker";
import makeHooksSystem, {HookSystem} from "./hook";
import makeFloor from "./floor";
import {Request} from "./request";
import {Response} from "./response";

export type handlerFunction = (floor: ReturnType<typeof makeFloor>, response: Response, existProcess: () => never) => void;

export type processBuild<values extends string, input extends {}, options extends {}> = {
	options?: options,
	drop?: values[],
	input?(pickup: ReturnType<typeof makeFloor>["pickup"]): input,
	allowExitProcess?: boolean,
}

export type processExec<values extends string, input extends {}, options extends {}> = {
	options?: options,
	pickup?: values[],
	input?: (pickup: ReturnType<typeof makeFloor>["pickup"]) => input,
}

export type processFunction = (request: Request, response: Response, options: any, input: any) => Promise<void> | void

export interface builderProcess<addHook extends (...args: any) => any> {
	hook(name: Parameters<addHook>[0], hookFunction: Parameters<addHook>[1]): builderProcess<addHook>, 
	extract(extractObj: extractObj, error?: errorExtract): Omit<builderProcess<addHook>, "hook" | "extract">, 
	check(checker: returnCheckerExec | shortChecker): Omit<builderProcess<addHook>, "hook" | "extract">, 
	process(returnProcessExec: returnProcessExec): Omit<builderProcess<addHook>, "hook" | "extract">, 
	handler(handlerFunction: handlerFunction): Omit<builderProcess<addHook>, "hook" | "extract" | "check" | "process" | "handler">, 
	build: ReturnType<ReturnType<typeof makeProcessSystem>["createProcess"]>["build"],
}

export type useProcess<values extends string, input extends {}, options extends {}> = {
	options?: options,
	pickup?: values[],
	input?: () => input,
};

export interface processUse<values extends string, input extends {}, options extends {}>{
	(processUse?: processExec<values, input, options>): returnProcessExec;
	use(
		request: Request, 
		response: Response, 
		processExec?: useProcess<values, input, options>
	): void | Promise<void>;
}

export type returnProcessExec = {
	name: string,
	options?: any,
	processFunction: processFunction,
	pickup?: string[],
	hooks: HookSystem["hooks"],
	type: string,
	input?: (pickup: ReturnType<typeof makeFloor>["pickup"]) => any,
}

class ExistProcess{}

export default function makeProcessSystem(){
	const extracted: extractObj = {};
	let errorExtract: errorExtract = (response, type, index, err) => {
		response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send(err.issues);
	};
		
	function createProcess(name: string){
		type shortBuilderProcess = builderProcess<typeof addHook>;
		const {addHook, copyHook, hooks} = makeHooksSystem(["error", "beforeSent", "afterSent"]);
		const hook: shortBuilderProcess["hook"] = (name, hookFunction) => {
			addHook(name, hookFunction);
			return {
				hook,
				extract,
				handler,
				check,
				build,
				process,
			};
		};

		const extract: shortBuilderProcess["extract"] = (extractObj, error?) => {
			Object.entries(extractObj).forEach(([index, value]) => {
				extracted[index as keyof extractObj] = value;
			});
			errorExtract = error || errorExtract;

			return {
				handler,
				check,
				build,
				process,
			};
		};

		const checkers: (returnCheckerExec | shortChecker | returnProcessExec)[] = [];
		const process: shortBuilderProcess["process"] = (returnProcessExec) => {
			checkers.push(returnProcessExec);
			copyHook(returnProcessExec.hooks, "error", "error");
			copyHook(returnProcessExec.hooks, "beforeSent", "beforeSent");
			copyHook(returnProcessExec.hooks, "afterSent", "afterSent");
			return {
				check,
				process,
				handler,
				build,
			};
		};

		const check: shortBuilderProcess["check"] = (checker) => {
			checkers.push(checker);
			return {
				check,
				handler,
				build,
				process,
			};
		};

		let grapHandlerFunction: handlerFunction;
		const handler: shortBuilderProcess["handler"] = (handlerFunction) => {
			grapHandlerFunction = handlerFunction;

			return {
				build
			};
		};

		function build<
			values extends string,
			input extends {},
			options extends {} 
		>(processBuild?: processBuild<values, input, options>){
			// force import zone
			const ZE = ZodError;
			const mf = makeFloor;
			const EP = ExistProcess;
			if(!!ZE && !!mf && !!EP && false){console.log();}

			let stringFunction = /* js */`
				const {pickup, drop} = mf();
			`;
			let isAsync = false;

			if(processBuild?.allowExitProcess)stringFunction += `
				try{
			`;

			if(processBuild?.input){
				stringFunction += /* js */`
					drop("input", input);
				`;
			}

			if(processBuild?.options){
				stringFunction += /* js */`
					drop("options", options);
				`;
			}

			if(Object.keys(extracted).length !== 0){
				stringFunction += `
					let currentExtractedType;
					let currentExtractedIndex;
					try {
				`;
				Object.entries(extracted).forEach(([type, content]) => {
					if(content instanceof zod.ZodType){
						stringFunction += /* js */`
							currentExtractedType = "${type}";
							currentExtractedIndex = "";
							drop(
								"${type}",
								extracted.${type}.parse(request.${type})
							);
						`;
					}
					else {
						Object.keys(content).forEach((index) => {
							stringFunction += /* js */`
								currentExtractedType = "${type}";
								currentExtractedIndex = "${index}";
								drop(
									"${index}",
									extracted.${type}.${index}.parse(request.${type}.${index})
								);
							`;
						});
					}
				});
				stringFunction += /* js */`
					} catch(err) {
						if(err instanceof ZE)errorExtract(response, currentExtractedType, currentExtractedIndex, err);
						else throw err;
					}
				`;
			}

			if(checkers.length !== 0){
				stringFunction += /* js */`
					let currentChecker;
					let result;
				`;

				checkers.forEach((value, index) => {
					if(typeof value === "function"){
						stringFunction += /* js */`
							currentChecker = "anonyme";
						`;
						if(value.constructor.name === "AsyncFunction"){
							stringFunction += /* js */`
								await checkers[${index}]({pickup, drop}, response, () => {throw EP;});
							`;
							isAsync = true;
						}
						else stringFunction += /* js */`
							checkers[${index}]({pickup, drop}, response, () => {throw EP;});
						`;
					}
					else if(value.type === "checker"){
						value = value as returnCheckerExec;
						stringFunction += /* js */`
							currentChecker = checkers[${index}].name;
						`;
						if(value.handler.constructor.name === "AsyncFunction"){
							stringFunction += /* js */`
								result = await checkers[${index}].handler(
									checkers[${index}].input(pickup),
									(info, data) => ({info, data}),
									checkers[${index}].options
								);
							`;
							isAsync = true;
						}
						else stringFunction += /* js */`
							result = checkers[${index}].handler(
								checkers[${index}].input(pickup),
								(info, data) => ({info, data}),
								checkers[${index}].options
							);
						`;
						stringFunction += /* js */`
							if(!checkers[${index}].validate(result.info, result.data))checkers[${index}].catch(response, result.info, result.data, () => {throw EP;});
						`;
						if(value.output)stringFunction += /* js */`
							checkers[${index}].output(drop, result.data);
						`;
					}
					else if(value.type === "process"){
						value = value as returnProcessExec;
						stringFunction += /* js */`
							currentChecker = checkers[${index}].name;
						`;
						if(value.processFunction.constructor.name === "AsyncFunction"){
							stringFunction += /* js */`
								result = await checkers[${index}].processFunction(
									request, 
									response, 
									checkers[${index}].options,
									${value.input ? /* js */`checkers[${index}].input(pickup)` : ""}
								);
							`;
							isAsync = true;
						}
						else stringFunction += /* js */`
							result = checkers[${index}].processFunction(
								request, 
								response, 
								checkers[${index}].options,
								${value.input ? /* js */`checkers[${index}].input(pickup)` : ""}
							);
						`;
						if(value.pickup){
							value.pickup.forEach(index => {
								stringFunction += /* js */`
									drop("${index}", result["${index}"]);
								`;
							});
						}
					}
				});
			}

			if(grapHandlerFunction){
				if(grapHandlerFunction.constructor.name === "AsyncFunction"){
					stringFunction += /* js */`
						await grapHandlerFunction({pickup, drop}, response, () => {throw EP;});
					`;
					isAsync = true;
				}
				else stringFunction += /* js */`
					grapHandlerFunction({pickup, drop}, response, () => {throw EP;});
				`;
			}

			if(processBuild?.allowExitProcess)stringFunction += /* js */`
				} catch(error) {
					if(error !== EP) throw error;
				}
			`;

			if(processBuild?.drop && processBuild?.drop.length !== 0){
				stringFunction += "return {";
				processBuild.drop.forEach(index => {
					stringFunction += /* js */`
						"${index}": pickup("${index}"),
					`;
				});
				stringFunction += "}";
			}
			
			const processFunction: processFunction = eval((isAsync ? "async" : "") + /* js */`(request, response, input, options) => {${stringFunction}}`);

			const processExec: processUse<values, input, options> = function(processExec){
				return {
					name,
					options: processExec?.options || processBuild?.options,
					input: processExec?.input || processBuild?.input,
					processFunction,
					pickup: processExec?.pickup,
					hooks,
					type: "process",
				};
			};

			processExec.use = function(request, response, processExec){
				return processFunction(
					request, 
					response, 
					processExec?.options || processBuild?.options,
					processExec?.input?.(),
				);
			};

			return processExec;
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
