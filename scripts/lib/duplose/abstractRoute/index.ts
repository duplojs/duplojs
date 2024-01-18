import {ZodError, ZodType} from "zod";
import {Duplose} from "..";
import {Request} from "../../request";
import {Response} from "../../response";
import {CheckerStep} from "../../step/checker";
import {CutStep} from "../../step/cut";
import {condition, mapped, spread} from "../../stringBuilder";
import {abstractRouteFunctionString} from "../../stringBuilder/abstractRoute";
import {checkerStep, cutStep, extractedTry, extractedType, extractedTypeKey, processDrop, processStep, skipStep, subAbstractRouteString} from "../../stringBuilder/route";
import {AnyFunction} from "../../utile";
import {handlerFunctionString} from "../../stringBuilder/process";
import {makeFloor} from "../../floor";
import {ExtendsSubAbstractRoute, SubAbstractRoute, SubAbstractRouteParams} from "./sub";
import {ExtendsAbstractRouteInstance} from "./instance";

export type AbstractRouteFunction = (request: Request, response: Response, options: any) => Record<string, any> | Promise<Record<string, any>>;

export type EditingFunctionAbstractRoute = (abstractRoute: AbstractRoute) => void;

export abstract class AbstractRoute<
	_options extends Record<string, any> = any,
	_floor extends {} = {},
> extends Duplose<AbstractRouteFunction, EditingFunctionAbstractRoute>{
	public drop: string[] = [];
	public options?: _options;
	public children: SubAbstractRoute[] = [];

	abstract get SubAbstractRoute(): typeof ExtendsSubAbstractRoute;
	abstract get AbstractRouteInstance(): typeof ExtendsAbstractRouteInstance;

	constructor(
		public name: string,
		public subAbstractRoute: SubAbstractRoute | undefined,
		desc: any[],
	){	
		super(desc);
		if(subAbstractRoute){
			Object.keys(this.hooksLifeCyle).forEach((key) => {
				this.hooksLifeCyle[key].copySubscriber(
					subAbstractRoute.hooksLifeCyle[key].subscribers as AnyFunction[]
				);
			});
			this.addDesc("abstract", subAbstractRoute.desc);
		}
	}

	setDrop(drop: any[], desc: any[]){
		this.drop = drop || [];
			
		this.addDesc("drop", desc);
	}

	setOptions(options: any, desc: any[]){
		this.options = options;

		this.addDesc("options", desc);
	}

	createInstance(params: SubAbstractRouteParams, desc: any[]){
		const sub = new this.SubAbstractRoute(this, params, desc);
		this.children.push(sub);
		return new this.AbstractRouteInstance(sub);
	}

	build(){
		this.steps.forEach(value => value.build());
			
		this.stringDuploseFunction = abstractRouteFunctionString(
			!!this.options,
			spread(
				condition(
					!!this.subAbstractRoute,
					() => subAbstractRouteString(
						this.subAbstractRoute?.duploseFunction.constructor.name === "AsyncFunction",
						mapped(
							this.subAbstractRoute?.params.pickup || [],
							(value) => processDrop(value)
						)
					)
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
								(step.short as () => {}).constructor.name === "AsyncFunction", 
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
				condition(
					!!this.handler,
					() => handlerFunctionString(
						this.handler?.constructor.name === "AsyncFunction"
					)
				)
			),
			this.drop
		);

		this.editingDuploseFunctions.forEach(editingFunction => editingFunction(this));

		this.duploseFunction = eval(this.stringDuploseFunction).bind({
			subAbstractRoute: this.subAbstractRoute,
			extracted: this.extracted,
			errorExtract: this.errorExtract,
			steps: this.steps,
			handler: this.handler,
			extensions: this.extensions,

			makeFloor,
			ZodError,
		});
		
		this.children.forEach(child => child.build());
	}
}

//@ts-ignore
export class ExtendsAbstractRoute extends AbstractRoute<any, any>{}
