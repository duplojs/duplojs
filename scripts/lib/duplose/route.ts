import {AbstractRoute} from "../abstractRoute";
import makeContentTypeParserSystem from "../contentTypeParser";
import correctPath from "../correctPath";
import {Floor, makeFloor} from "../floor";
import {condition, mapped, spread} from "../stringBuilder";
import {abstractRouteString, checkerStep, cutStep, extractedTry, extractedType, extractedTypeKey, hookBody, processDrop, processStep, routeFunctionString, skipStep} from "../stringBuilder/route";
import {HooksLifeCycle, makeHooksLifeCycle} from "../hook";
import {DuploConfig} from "../main";
import {Request, methods} from "../request";
import {Response, __exec__} from "../response";
import {AnyFunction, DescriptionAll, PromiseOrNot} from "../utility";
import {ZodError, ZodType} from "zod";
import {CheckerStep} from "../step/checker";
import {ProcessStep} from "../step/process";
import {CutStep} from "../step/cut";

export type EditingFunctionRoute = (route: Route) => void;

export type ErrorExtractFunction<response extends Response> = (response: response, type: keyof RouteExtractObj, index: string, err: ZodError) => void

export interface RouteExtractObj{
	body?: Record<string, ZodType> | ZodType,
	params?: Record<string, ZodType> | ZodType,
	query?: Record<string, ZodType> | ZodType,
	headers?: Record<string, ZodType> | ZodType,
}
export type RouteFunction = (request: Request, response: Response) => Promise<void> | void;

export type RoutehandlerFunction<
	response extends Response, 
	floor extends {},
> = (floor: Floor<floor>, response: response) => void;

export type RouteErrorHandlerFunction = (request: Request, response: Response, error: Error) => PromiseOrNot<void>;

export abstract class Route{
	public hooksLifeCyle: HooksLifeCycle<Request, Response> = makeHooksLifeCycle();
	public extracted: RouteExtractObj = {};
	public steps: (CheckerStep | ProcessStep | CutStep)[] = [];
	public descs: DescriptionAll[] = [];
	public handlerFunction: RoutehandlerFunction<any, any> = () => {};
	public routeFunction: RouteFunction = () => {};
	public editingFunctions: EditingFunctionRoute[] = [];
	public extensions: Record<string, any> = {};
	public stringFunction: string = "";
	public errorExtract: ErrorExtractFunction<Response> = () => {};

	public abstract get errorHandlerFunction(): RouteErrorHandlerFunction;
	public abstract get parseContentTypeBody(): ReturnType<typeof makeContentTypeParserSystem>["parseContentTypeBody"];
	public abstract get config(): DuploConfig;
	public abstract get mainHooksLifeCyle(): HooksLifeCycle<Request, Response>;
	public abstract get defaultErrorExtract(): ErrorExtractFunction<Response>;

	constructor(
		public method: methods,
		public paths: string[],
		public abstractRoute: AbstractRoute | undefined,
	){
		this.paths = this.paths.map(path => correctPath(path));
		Object.keys(this.hooksLifeCyle).forEach((key) => {
			this.hooksLifeCyle[key].copySubscriber(
				this.mainHooksLifeCyle[key].subscribers as AnyFunction[],
				this.abstractRoute?.hooksLifeCyle[key].subscribers || [] as AnyFunction[]
			);
		});
		this.setExtract({}, undefined, []);
	}

	setExtract(extractObj: RouteExtractObj, error: ErrorExtractFunction<Response> | undefined, desc: any[]){
		this.extracted = extractObj;
		this.errorExtract = error || this.defaultErrorExtract;

		this.addDesc("extracted", desc);
	}

	addStepProcess(processStep: ProcessStep, desc: any[]){
		Object.keys(this.hooksLifeCyle).forEach((key) => {
			this.hooksLifeCyle[key].copySubscriber(
				processStep.process.hooksLifeCyle[key].subscribers as AnyFunction[],
			);
		});

		this.steps.push(processStep);

		if(desc.length !== 0){
			this.descs.push({
				type: "process", 
				descStep: desc,
				index: this.steps.length - 1
			});
		}
	}
	
	addStepChecker(checkerStep: CheckerStep, desc: any[]){
		this.steps.push(checkerStep);

		if(desc.length !== 0){
			this.descs.push({
				type: "checker", 
				descStep: desc,
				index: this.steps.length - 1
			});
		}
	}
	
	addStepCut(cutStep: CutStep, desc: any[]){
		this.steps.push(cutStep);

		if(desc.length !== 0){
			this.descs.push({
				type: "cut", 
				descStep: desc,
				index: this.steps.length - 1
			});
		}
	}

	setHandler(handlerFunction: RoutehandlerFunction<Response, {}>, desc: any[]){
		this.handlerFunction = handlerFunction;

		this.addDesc("handler", desc);
	}

	addDesc(type: DescriptionAll["type"], desc: any[]){
		if(desc.length !== 0){
			this.descs.push({
				type: (type as any), 
				descStep: desc
			});
		}
	}

	build(){
		this.steps.forEach(value => value.build());

		this.stringFunction = routeFunctionString(
			this.handlerFunction.constructor.name === "AsyncFunction",
			!!this.hooksLifeCyle.onConstructRequest.subscribers.length,
			!!this.hooksLifeCyle.onConstructResponse.subscribers.length,
			!!this.hooksLifeCyle.beforeRouteExecution.subscribers.length,
			!!this.hooksLifeCyle.onError.subscribers.length,
			!!this.hooksLifeCyle.beforeSend.subscribers.length,
			!!this.hooksLifeCyle.afterSend.subscribers.length,
			spread(
				condition(
					!!this.abstractRoute,
					() => abstractRouteString(
						this.abstractRoute?.abstractRouteFunction.constructor.name === "AsyncFunction",
						mapped(
							this.abstractRoute?.pickup || [],
							(value) => processDrop(value)
						)
					)
				),
				condition(
					!!this.extracted.body,
					() => hookBody(!!this.hooksLifeCyle.beforeParsingBody.subscribers.length)
				),
				condition(
					Object.keys(this.extracted).length !== 0,
					() => extractedTry(
						mapped(
							Object.entries(this.extracted),
							([type, value]) => value instanceof ZodType ?
								extractedType(type) :
								mapped(
									Object.keys(value || {}),
									(key) => extractedTypeKey(type, key)
								)
						)
					)
				),
				condition(
					this.steps.length !== 0,
					() => mapped(
						this.steps,
						(step, index) => step instanceof CutStep ?
							cutStep(
								step.short.constructor.name === "AsyncFunction", 
								index,
								mapped(
									step.drop,
									value => processDrop(value)
								)
							) :
							step instanceof CheckerStep ?
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
			)
		);

		this.editingFunctions.forEach(editingFunction => editingFunction(this));

		this.routeFunction = eval(this.stringFunction).bind({
			abstractRoute: this.abstractRoute,
			extracted: this.extracted, 
			errorExtract: this.errorExtract,
			steps: this.steps, 
			handlerFunction: this.handlerFunction,
			extensions: this.extensions,
			hooks: {
				launchAfterSend: this.hooksLifeCyle.afterSend.build(),
				launchBeforeParsingBody: this.hooksLifeCyle.beforeParsingBody.build(),
				launchBeforeSend: this.hooksLifeCyle.beforeSend.build(),
				launchOnConstructRequest: this.hooksLifeCyle.onConstructRequest.build(),
				launchOnConstructResponse: this.hooksLifeCyle.onConstructResponse.build(),
				launchOnError: this.hooksLifeCyle.onError.build(),
				launchBeforeRouteExecution: this.hooksLifeCyle.beforeRouteExecution.build(),
			},
			ZodError, 
			makeFloor,
			Response,
			Request,
			__exec__,
			errorHandlerFunction: this.errorHandlerFunction,
			parseContentTypeBody: this.parseContentTypeBody,
			config: this.config,
		});
	}
}

//@ts-ignore
export class ExtendsRoute extends Route{}
