import {Request} from "./request";
import makeFloor from "./floor";
import {Response, ResponseInstance, __exec__} from "./response";
import extractPathAndQueryFromUrl from "./extractPathAndQueryFromUrl";
import zod, {ZodError, ZodType} from "zod";
import {returnCheckerExec, shortChecker} from "./checker";
import makeHooksSystem, {HookSystem} from "./hook";
import {anotherbackConfig} from "./main";
import {returnProcessExec} from "./process";

export type extractObj = {
	body?: Record<string, ZodType> | ZodType,
	params?: Record<string, ZodType> | ZodType,
	query?: Record<string, ZodType> | ZodType,
	cookies?: Record<string, ZodType> | ZodType,
	headers?: Record<string, ZodType> | ZodType,
}
export type errorExtract = (response: Response, type: keyof extractObj, index: string, err: ZodError) => void

export type routesObject = Record<
	Request["method"], 
	Record<string, (request: Request, response: Response) => Promise<void> | void>
>;

export type handlerFunction = (floor: {pickup: ReturnType<typeof makeFloor>["pickup"], drop: ReturnType<typeof makeFloor>["drop"]}, response: Response) => void;

export type notfoundHandlerFunction = (request: Request, response: Response) => void;

export type hook<addHook extends (...args: any) => any> = (name: Parameters<addHook>[0], hookFunction: Parameters<addHook>[1]) => {hook: hook<addHook>, extract: extract, handler: handler, check: check, process: process};
export type extract = (extractObj: extractObj, error?: errorExtract) => {handler: handler, check: check, process: process}
export type check = (checker: returnCheckerExec | shortChecker) => {handler: handler, check: check, process: process};
export type process = (returnProcessExec: returnProcessExec) => {handler: handler, check: check, process: process};
export type handler = (handlerFunction: handlerFunction) => void;

export default function makeRoutesSystem(config: anotherbackConfig, mainHooks: HookSystem["hooks"]){
	const routes: routesObject = {
		GET: {},
		POST: {},
		PUT: {}, 
		PATCH: {},
		DELETE: {}, 
		OPTIONS: {}, 
		HEAD: {}, 
	};

	const buildedRoutes: Record<string, (path: string) => {path: string, params: Record<string, string>}> = {};
	let notfoundHandlerFunction: notfoundHandlerFunction = (request: Request, response: Response) => {
		return response.code(404).info("NOTFOUND").send(`${request.method}:${request.path} not found`);
	};

	return {
		declareRoute(method: Request["method"], path: string){
			path = config.prefix + extractPathAndQueryFromUrl(path).path;

			const {addHook, buildHooks, launchHooks, copyHook} = makeHooksSystem(["error", "beforeSent", "afterSent"]);
			let hasHook = false;
			const hook: hook<typeof addHook> = (name, hookFunction) => {
				if(hasHook === false){
					hasHook = true;
					copyHook(mainHooks, "error", "error");
					copyHook(mainHooks, "beforeSent", "beforeSent");
					copyHook(mainHooks, "afterSent", "afterSent");
				}
				addHook(name, hookFunction);
				return {
					hook,
					extract,
					handler,
					check,
					process,
				};
			};

			const extracted: extractObj = {};
			let errorExtract: errorExtract = (response, type, index, err) => {
				response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send(err.issues);
			};
			const extract: extract = (extractObj, error?) => {
				Object.entries(extractObj).forEach(([index, value]) => {
					extracted[index as keyof extractObj] = value;
				});
				errorExtract = error || errorExtract;

				return {
					check,
					handler,
					process,
				};
			};

			const checkers: (returnCheckerExec | shortChecker | returnProcessExec)[] = [];
			const process: process = (returnProcessExec) => {
				checkers.push(returnProcessExec);
				if(hasHook === false){
					hasHook = true;
					copyHook(mainHooks, "error", "error");
					copyHook(mainHooks, "beforeSent", "beforeSent");
					copyHook(mainHooks, "afterSent", "afterSent");
				}

				if(Object.values(returnProcessExec.hooks).flat(1).length !== 0){
					copyHook(returnProcessExec.hooks, "error", "error");
					copyHook(returnProcessExec.hooks, "beforeSent", "beforeSent");
					copyHook(returnProcessExec.hooks, "afterSent", "afterSent");
				}
				
				return {
					check,
					process,
					handler,
				};
			};

			const check: check = (checker) => {
				checkers.push(checker);
				return {
					check,
					handler,
					process,
				};
			};

			const handler: handler = (handlerFunction) => {
				buildHooks();

				// force import zone
				const ZE = ZodError;
				const mf = makeFloor;
				const lh = launchHooks;
				const RI = ResponseInstance;
				const _e_ = __exec__;
				if(!!ZE && !!mf && !!lh && !!RI && !!_e_ && false){console.log();}

				let stringFunction = /* js */`
					const {pickup, drop} = mf();
				`;
				let isAsync = false;

				if(hasHook === true)stringFunction += `
					try {
				`;

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
							if(value.constructor.name === "AsyncFunction"){
								stringFunction += /* js */`
									await checkers[${index}]({pickup, drop}, response, () => {});
								`;
								isAsync = true;
							}
							else stringFunction += /* js */`
								checkers[${index}]({pickup, drop}, response, () => {});
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
								if(!checkers[${index}].validate(result.info, result.data))checkers[${index}].catch(response, result.info, result.data, () => {});
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

				if(handlerFunction.constructor.name === "AsyncFunction"){
					stringFunction += /* js */`
						await handlerFunction({pickup, drop}, response);
					`;
					isAsync = true;
				}
				else stringFunction += /* js */`
					handlerFunction({pickup, drop}, response);
				`;

				if(hasHook === true)stringFunction += /* js */`
					} catch(result) {
						if(result instanceof Error){
							response.code(500);
							response.data = result;
							result = response;
							await lh("error", request, response, result);
						}

						if(result?.[Symbol.hasInstance]?.(RI)){
							await lh("beforeSent", request, response);
							result[_e_]();
							await lh("afterSent", request, response);
						}
						else throw result;
					}
				`;				
				
				routes[method][path] = eval((isAsync || hasHook ? "async" : "") + /* js */`(request, response) => {${stringFunction}}`);
			};

			return {
				extract,
				check,
				handler,
				hook,
				process
			};
		},
		setNotfoundHandler(notFoundFunction: notfoundHandlerFunction){
			notfoundHandlerFunction = notFoundFunction;
		},
		buildRoute(){
			Object.entries(routes).forEach(([index, value]) => {
				let stringFunction = "let result;\n";

				Object.keys(value).forEach(path => {
					let regex = `/^${path.replace(/\//g, "\\/")}$/`.replace(
						/\{([a-zA-Z0-9_\-]+)\}/g,
						(match, group1) => `(?<${group1}>[a-zA-Z0-9_\-]+)`
					);

					stringFunction += /* js */`
						result = ${regex}.exec(path);
						if(result !== null) return {
							path: "${path}",
							params: result.groups || {}
						};
					`;
				});
				
				buildedRoutes[index] = eval(/* js */`path => {${stringFunction}}`);
			});
		},
		findRoute(method: Request["method"], path: string){
			if(!buildedRoutes[method]) return {
				notfoundFunction: notfoundHandlerFunction
			};
			
			let result = buildedRoutes[method](path);
			
			if(!result) return {
				notfoundFunction: notfoundHandlerFunction,
			};
			else return {
				routeFunction: routes[method][result.path],
				params: result.params
			};
		},
		routes,
		buildedRoutes,
	};
}
