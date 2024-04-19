import {condition, mapped, spread} from "../stringBuilder";
import {checkerStep, cutStep, extractedTry, extractedType, extractedTypeKey, hookBody, processDrop, processStep, routeFunctionString, skipStep, subAbstractRouteString} from "../stringBuilder/route";
import {Hook, HooksLifeCycle, copyHooksLifeCycle, makeHooksLifeCycle} from "../hook";
import {Request, HttpMethods} from "../request";
import {Response} from "../response";
import {AnyFunction, PromiseOrNot, correctPath, makeFloor} from "../utils";
import {ZodError, ZodType} from "zod";
import {CheckerStep} from "../step/checker";
import {CutStep} from "../step/cut";
import {Duplose} from ".";
import {SubAbstractRoute} from "./abstractRoute/sub";
import {ProcessStep} from "../step/process";

export type EditingFunctionRoute = (route: Route) => void;

export type RouteFunction = (request: Request, response: Response) => Promise<void> | void;

export type RouteErrorHandlerFunction = (request: Request, response: Response, error: Error) => PromiseOrNot<void>;

export abstract class Route extends Duplose<RouteFunction, EditingFunctionRoute>{
	public abstract get errorHandlerFunction(): RouteErrorHandlerFunction;
	public abstract get mainHooksLifeCyle(): HooksLifeCycle<Request, Response>;

	constructor(
		public method: HttpMethods,
		public paths: string[],
		public subAbstractRoute: SubAbstractRoute | undefined,
		desc: any[],
	){
		super(desc);
		this.paths = this.paths.map(path => correctPath(path));

		if(subAbstractRoute){
			this.addDesc("abstract", subAbstractRoute.desc);
		}
	}

	build(){
		if(!this.handler){
			throw new Error("Route Need handler");
		}

		this.steps.forEach(value => value.build());

		const localHooksLifeCycle = makeHooksLifeCycle();
		copyHooksLifeCycle(localHooksLifeCycle, this.hooksLifeCyle);
		this.copyStepHooks(localHooksLifeCycle);
		this.subAbstractRoute?.parent.copyHook(localHooksLifeCycle);
		copyHooksLifeCycle(localHooksLifeCycle, this.mainHooksLifeCyle);

		this.stringDuploseFunction = routeFunctionString(
			this.handler.constructor.name === "AsyncFunction",
			!!localHooksLifeCycle.onConstructRequest.subscribers.length,
			!!localHooksLifeCycle.onConstructResponse.subscribers.length,
			!!localHooksLifeCycle.beforeRouteExecution.subscribers.length,
			!!localHooksLifeCycle.onError.subscribers.length,
			!!localHooksLifeCycle.beforeSend.subscribers.length,
			!!localHooksLifeCycle.afterSend.subscribers.length,
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
					() => hookBody()
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
								step.parent.constructor.name === "AsyncFunction", 
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
			handler: this.handler,
			extensions: this.extensions,
			hooks: {
				launchAfterSend: localHooksLifeCycle.afterSend.build(),
				launchParsingBody: localHooksLifeCycle.parsingBody.build(),
				launchBeforeSend: localHooksLifeCycle.beforeSend.build(),
				launchOnConstructRequest: localHooksLifeCycle.onConstructRequest.build(),
				launchOnConstructResponse: localHooksLifeCycle.onConstructResponse.build(),
				launchOnError: localHooksLifeCycle.onError.build(),
				launchBeforeRouteExecution: localHooksLifeCycle.beforeRouteExecution.build(),
				launchSerializeBody: localHooksLifeCycle.serializeBody.build(),
			},
			ZodError, 
			makeFloor,
			Response,
			Request,
			errorHandlerFunction: this.errorHandlerFunction,
			config: this.config,
		});
	}
}

//@ts-ignore
export class ExtendsRoute extends Route{}
