import {ZodType, ZodError} from "zod";
import {CheckerExport} from "./checker";
import makeFloor from "./floor";
import {AddHooksLifeCycle, makeHooksLifeCycle} from "./hook";
import {ProcessExport, ProcessHandlerFunction, __exitProcess__} from "./process";
import {DeclareRoute, RouteExtractObj, RouteProcessParams, condition, mapped, spread} from "./route";
import correctPath from "./correctPath";
import Response from "./response";
import Request from "./request";

export interface AbstractRoute{
	prefix: string;
	name: string;
	hooksLifeCyle: ReturnType<typeof makeHooksLifeCycle>;
	pickup: string[];
	options: Record<string, any>;
	abstractRouteFunction: AbstractRouteFunction;
}

export type ErrorExtractAbstractRouteFunction<response extends Response> = (response: response, type: keyof RouteExtractObj, index: string, err: ZodError, exitProcess: () => never) => void;

export type AbstractRouteFunction = (request: Request, response: Response, options: any) => Record<string, any> | Promise<Record<string, any>>;

export type DeclareAbstractRoute<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends RouteExtractObj = RouteExtractObj,
> = (name: string, abstractRoute?: AbstractRoute) => BuilderPatternAbstractRoute<request, response, extractObj>;

export type AbstractRouteShortAccess<request extends Request, response extends Response> = (floor: ReturnType<typeof makeFloor>, request: request, response: response, exitProcess: () => never) => void | Promise<void>;

export interface BuildAbstractRouteParameters<values extends string, options extends any>{
	options?: options;
	prefix?: string;
	drop?: values[];
	allowExitProcess?: boolean;
}

export interface AbstractRouteParams<values extends string, options extends any>{
	pickup?: values[]; 
	options?: options;
	ignorePrefix?: boolean;
}

export type AbstractRouteHandlerFunction<response extends Response> = (floor: ReturnType<typeof makeFloor>, response: response, exitProcess: () => never) => void;

export type AbstractRouteShort<response extends Response> = (floor: ReturnType<typeof makeFloor>, response: response, exitProcess: () => never) => void | Promise<void>;

export interface AbstractRouteCheckerParams<checkerExport extends CheckerExport, response extends Response>{
	input(pickup: ReturnType<typeof makeFloor>["pickup"]): Parameters<checkerExport["handler"]>[0];
	validate(info: checkerExport["outputInfo"][number], data?: any): boolean;
	catch(response: response, info: checkerExport["outputInfo"][number], data: any, exitProcess: () => never): void;
	output?: (drop: ReturnType<typeof makeFloor>["drop"], info: checkerExport["outputInfo"][number], data?: any) => void;
	readonly options?: checkerExport["options"];
}

export type UseAbstractRoute<
	values extends string, 
	options extends any,
	request extends Request,
	response extends Response,
	extractObj extends RouteExtractObj = RouteExtractObj
> = (params?: AbstractRouteParams<values, options>) => {
	declareRoute<
		req extends Request = request, 
		res extends Response = response,
		extObj extends RouteExtractObj = extractObj
	>(method: Request["method"], path: string | string[]): ReturnType<DeclareRoute<request & req, response & res, extractObj & extObj>>;

	declareAbstractRoute<
		req extends Request = request, 
		res extends Response = response,
		extObj extends RouteExtractObj = extractObj
	>(name: string): ReturnType<DeclareAbstractRoute<request & req, response & res, extractObj & extObj>>;
};

export interface BuilderPatternAbstractRoute<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends RouteExtractObj = RouteExtractObj,
>{
	hook: AddHooksLifeCycle<BuilderPatternAbstractRoute<request, response, extractObj>>["addHook"];

	access<processExport extends ProcessExport>(
		process: processExport | AbstractRouteShortAccess<request, response>, 
		params?: RouteProcessParams<processExport>
	): Omit<BuilderPatternAbstractRoute<request, response, extractObj>, "hook" | "access">;

	extract(
		extractObj: extractObj,
		error?: ErrorExtractAbstractRouteFunction<response>
	): Omit<BuilderPatternAbstractRoute<request, response, extractObj>, "hook" | "extract" | "access">;

	check<checkerExport extends CheckerExport>(
		checker: checkerExport, 
		params: AbstractRouteCheckerParams<checkerExport, response>
	): Omit<BuilderPatternAbstractRoute<request, response, extractObj>, "hook" | "extract" | "access">;

	process<processExport extends ProcessExport>(
		process: processExport, 
		params?: RouteProcessParams<processExport>
	): Omit<BuilderPatternAbstractRoute<request, response, extractObj>, "hook" | "extract" | "access">;

	cut(short: AbstractRouteShort<response>): Omit<BuilderPatternAbstractRoute<request, response, extractObj>, "hook" | "extract" | "access">;

	handler(handlerFunction: AbstractRouteHandlerFunction<response>): Omit<BuilderPatternAbstractRoute<request, response, extractObj>, "hook" | "extract" | "access" | "check" | "process" | "cut" | "handler">;
	
	build<drop extends string, options extends any>(buildAbstractRouteParameters?: BuildAbstractRouteParameters<drop, options>): UseAbstractRoute<drop, options, request, response>;
}

export default function makeAbstractRoutesSystem(declareRoute: DeclareRoute){
	const declareAbstractRoute: DeclareAbstractRoute = (name, abstractRoute) => {
		const hooksLifeCyle = makeHooksLifeCycle();
		if(abstractRoute){
			//copy abstract hook
			hooksLifeCyle.onConstructRequest.copySubscriber(abstractRoute.hooksLifeCyle.onConstructRequest.subscribers);
			hooksLifeCyle.onConstructResponse.copySubscriber(abstractRoute.hooksLifeCyle.onConstructResponse.subscribers);
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
			};
		};

		let grapAccess: any;
		const access: BuilderPatternAbstractRoute["access"] = (processExport, params) => {
			if(typeof processExport === "function"){
				grapAccess = processExport;
			}
			else {
				hooksLifeCyle.onConstructRequest.copySubscriber(processExport.hooksLifeCyle.onConstructRequest.subscribers);
				hooksLifeCyle.onConstructResponse.copySubscriber(processExport.hooksLifeCyle.onConstructResponse.subscribers);
				hooksLifeCyle.beforeParsingBody.copySubscriber(processExport.hooksLifeCyle.beforeParsingBody.subscribers);
				hooksLifeCyle.onError.copySubscriber(processExport.hooksLifeCyle.onError.subscribers);
				hooksLifeCyle.beforeSend.copySubscriber(processExport.hooksLifeCyle.beforeSend.subscribers);
				hooksLifeCyle.afterSend.copySubscriber(processExport.hooksLifeCyle.afterSend.subscribers);

				grapAccess = {
					name: processExport.name,
					options: params?.options || processExport?.options,
					input: params?.input || processExport?.input,
					processFunction: processExport.processFunction,
					pickup: params?.pickup,
				};
			}

			return {
				extract,
				handler,
				check,
				process,
				cut,
				build,
			};
		};

		const extracted: RouteExtractObj = {};
		let errorExtract: ErrorExtractAbstractRouteFunction<Response> = (response, type, index, err) => {
			response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send();
		};
		const extract: BuilderPatternAbstractRoute["extract"] = (extractObj, error?) => {
			Object.entries(extractObj).forEach(([index, value]) => {
				extracted[index as keyof RouteExtractObj] = value;
			});
			errorExtract = error || errorExtract;

			return {
				check,
				handler,
				process,
				cut,
				build,
			};
		};

		const steps: any[] = [];
		const process: BuilderPatternAbstractRoute["process"] = (processExport, params) => {
			steps.push({
				type: "process",
				name: processExport.name,
				options: params?.options || processExport?.options,
				input: params?.input || processExport?.input,
				processFunction: processExport.processFunction,
				pickup: params?.pickup,
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
				cut,
				build,
			};
		};

		const check: BuilderPatternAbstractRoute["check"] = (checker, params) => {
			steps.push({
				type: "checker",
				name: checker.name,
				handler: checker.handler,
				options: params.options || checker.options || {},
				input: params.input,
				validate: params.validate,
				catch: params.catch,
				output: params.output,
			});

			return {
				check,
				handler,
				process,
				cut,
				build,
			};
		};

		const cut: BuilderPatternAbstractRoute["cut"] = (short) => {
			steps.push(short);

			return {
				check,
				handler,
				process,
				cut,
				build,
			};
		};

		let grapHandlerFunction: ProcessHandlerFunction<Response>;
		const handler: BuilderPatternAbstractRoute["handler"] = (handlerFunction) => {
			grapHandlerFunction = handlerFunction;

			return {
				build
			};
		};

		const build: BuilderPatternAbstractRoute["build"] = (buildAbstractRouteParameters) => {
			const stringFunction = abstractRouteFunctionString(
				!!buildAbstractRouteParameters?.options,
				exitProcessTry(
					!!buildAbstractRouteParameters?.allowExitProcess,
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
									(step, index) => typeof step === "function" ?
										cutStep(step.constructor.name === "AsyncFunction", index) :
										step.type === "checker" ?
											checkerStep(
												(step as CheckerExport).handler.constructor.name === "AsyncFunction",
												index,
												!!step.output
											) :
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
						),
						condition(
							!!grapHandlerFunction,
							() => handlerFunction(
								grapHandlerFunction.constructor.name === "AsyncFunction"
							)
						)
					)
				),
				buildAbstractRouteParameters?.drop || []
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
				exitProcess: buildAbstractRouteParameters?.allowExitProcess ?
					() => {throw __exitProcess__;} :
					() => {throw new Error("ExitProcess function is call in Process who has not 'allowExitProcess' define on true");}
			});

			return (params) => {
				const AbstractRouteParams = {
					abstractRouteFunction,
					hooksLifeCyle,
					name,
					prefix: params?.ignorePrefix ? "" : ((abstractRoute?.prefix || "") + correctPath(buildAbstractRouteParameters?.prefix || "")),
					pickup: params?.pickup || [],
					options: params?.options || buildAbstractRouteParameters?.options || {},
				};

				return {
					declareRoute: (method, path) => declareRoute(method, path, AbstractRouteParams) as any,
					declareAbstractRoute: (nameAbstractRoute) => declareAbstractRoute(nameAbstractRoute, AbstractRouteParams) as any,
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
		};
	};
	
	return {
		declareAbstractRoute<
			request extends Request = Request, 
			response extends Response = Response,
			extractObj extends RouteExtractObj = RouteExtractObj,
		>(name: string){
			return declareAbstractRoute(name) as ReturnType<DeclareAbstractRoute<request, response, extractObj>>;
		},
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
${async ? "await " : ""}this.grapAccess(floor, request, response);
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
let currentStep;

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
