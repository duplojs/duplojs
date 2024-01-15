import {ZodError, ZodType} from "zod";
import {makeFloor, Floor} from "../floor";
import {condition, mapped, spread} from "../stringBuilder";
import {HooksLifeCycle, makeHooksLifeCycle} from "../hook";
import {Request} from "../request";
import {Response} from "../response";
import {AnyFunction, DescriptionAll} from "../utility";
import {handlerFunctionString, processFunctionString} from "../stringBuilder/process";
import {checkerStep, cutStep, extractedTry, extractedType, extractedTypeKey, processDrop, processStep, skipStep} from "../stringBuilder/route";
import {CutStep} from "../step/cut";
import {ProcessStep} from "../step/process";
import {CheckerStep} from "../step/checker";
import {DuploConfig} from "../main";
import {Duplose, ExtractObject} from ".";

export type ProcessFunction = (request: Request, response: Response, options: any, input: any) => Record<string, any> | Promise<Record<string, any>>;

export type EditingFunctionProcess = (process: Process) => void;

export abstract class Process<
	input extends any = any, 
	options extends Record<string, any> = any, 
	extractObj extends ExtractObject = ExtractObject,
	floor extends Record<any, any> = Record<any, any>,
	drop extends string = string,
> extends Duplose<ProcessFunction, EditingFunctionProcess>{
	public drop: drop[] = [];
	public options?: options;
	public input?: ((pickup: Floor<Record<string, unknown>>["pickup"]) => input);

	constructor(
		public name: string,
		desc: any[],
	){
		super();
		this.addDesc("first", desc);
	}

	setDrop(drop: any[], desc: any[]){
		this.drop = drop || [];
			
		this.addDesc("build", desc);
	}

	setOptions(options: any, desc: any[]){
		this.options = options;

		this.addDesc("options", desc);
	}

	setInput(input: ((pickup: Floor<Record<string, unknown>>["pickup"]) => input), desc: any[]){
		this.input = input;

		this.addDesc("input", desc);
	}

	build(){
		this.steps.forEach(value => value.build());

		this.stringDuploseFunction = processFunctionString(
			!!this.input,
			!!this.options,
			spread(
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
				condition(
					!!this.handler,
					() => handlerFunctionString(
						this.handler?.constructor.name === "AsyncFunction"
					)
				)
			),
			this.drop || []
		);

		this.editingDuploseFunctions.forEach(editingFunction => editingFunction(this));

		this.duploseFunction = eval(this.stringDuploseFunction).bind({
			config: this.config,
			extracted: this.extracted,
			errorExtract: this.errorExtract,
			steps: this.steps, 
			handlerFunction: this.handler,
			extensions: this.extensions,

			ZodError,
			makeFloor,
		});
	}
}

//@ts-ignore
export class ExtendsProcess extends Process<any, any, any, any, any>{}
