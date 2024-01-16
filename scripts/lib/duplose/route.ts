import makeContentTypeParserSystem from "../contentTypeParser";
import correctPath from "../correctPath";
import {makeFloor} from "../floor";
import {condition, mapped, spread} from "../stringBuilder";
import {checkerStep, cutStep, extractedTry, extractedType, extractedTypeKey, hookBody, processDrop, processStep, routeFunctionString, skipStep, subAbstractRouteString} from "../stringBuilder/route";
import {HooksLifeCycle} from "../hook";
import {Request, methods} from "../request";
import {Response, __exec__} from "../response";
import {AnyFunction, PromiseOrNot} from "../utility";
import {ZodError, ZodType} from "zod";
import {CheckerStep} from "../step/checker";
import {CutStep} from "../step/cut";
import {Duplose} from ".";
import {SubAbstractRoute} from "./abstractRoute/sub";

export type EditingFunctionRoute = (route: Route) => void;

export type RouteFunction = (request: Request, response: Response) => Promise<void> | void;

export type RouteErrorHandlerFunction = (request: Request, response: Response, error: Error) => PromiseOrNot<void>;

export abstract class Route extends Duplose<RouteFunction, EditingFunctionRoute>{
	public abstract get errorHandlerFunction(): RouteErrorHandlerFunction;
	public abstract get parseContentTypeBody(): ReturnType<typeof makeContentTypeParserSystem>["parseContentTypeBody"];
	public abstract get mainHooksLifeCyle(): HooksLifeCycle<Request, Response>;

	constructor(
		public method: methods,
		public paths: string[],
		public subAbstractRoute: SubAbstractRoute | undefined,
		desc: any[],
	){
		super(desc);
		this.paths = this.paths.map(path => correctPath(path));
		Object.keys(this.hooksLifeCyle).forEach((key) => {
			this.hooksLifeCyle[key].copySubscriber(
				this.mainHooksLifeCyle[key].subscribers as AnyFunction[],
				subAbstractRoute?.hooksLifeCyle[key].subscribers || [] as AnyFunction[]
			);
		});
		if(subAbstractRoute){
			this.addDesc("abstract", subAbstractRoute.desc);
		}
	}

	build(){
		if(!this.handler){
			throw new Error("Route Need handler");
		}
		
		this.steps.forEach(value => value.build());

		this.stringDuploseFunction = routeFunctionString(
			this.handler.constructor.name === "AsyncFunction",
			!!this.hooksLifeCyle.onConstructRequest.subscribers.length,
			!!this.hooksLifeCyle.onConstructResponse.subscribers.length,
			!!this.hooksLifeCyle.beforeRouteExecution.subscribers.length,
			!!this.hooksLifeCyle.onError.subscribers.length,
			!!this.hooksLifeCyle.beforeSend.subscribers.length,
			!!this.hooksLifeCyle.afterSend.subscribers.length,
			spread(
				condition(
					!!this.subAbstractRoute,
					() => subAbstractRouteString(
						this.subAbstractRoute?.duploseFunction.constructor.name === "AsyncFunction",
						mapped(
							this.subAbstractRoute?.pickup || [],
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

		this.editingDuploseFunctions.forEach(editingFunction => editingFunction(this));

		this.duploseFunction = eval(this.stringDuploseFunction).bind({
			subAbstractRoute: this.subAbstractRoute,
			extracted: this.extracted, 
			errorExtract: this.errorExtract,
			steps: this.steps, 
			handlerFunction: this.handler,
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
