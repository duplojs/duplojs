import {ZodError, ZodType} from "zod";
import {makeFloor, Floor} from "../floor";
import {condition, mapped, spread} from "../stringBuilder";
import {HooksLifeCycle, makeHooksLifeCycle} from "../hook";
import {Request} from "../request";
import {Response} from "../response";
import {AnyFunction, DescriptionAll} from "../utility";
import {ErrorExtractFunction, RouteExtractObj, RoutehandlerFunction} from "./route";
import {handlerFunctionString, processFunctionString} from "../stringBuilder/process";
import {checkerStep, cutStep, extractedTry, extractedType, extractedTypeKey, processDrop, processStep, skipStep} from "../stringBuilder/route";
import {CutStep} from "../step/cut";
import {ProcessStep} from "../step/process";
import {CheckerStep} from "../step/checker";

export type ProcessFunction = (request: Request, response: Response, options: any, input: any) => Record<string, any> | Promise<Record<string, any>>;

export type EditingFunctionProcess = (process: Process) => void;

export class Process<
	input extends any = any, 
	options extends Record<string, any> = any, 
	extractObj extends RouteExtractObj = RouteExtractObj,
	floor extends Record<any, any> = Record<any, any>,
	drop extends string = string,
>{
	public hooksLifeCyle: HooksLifeCycle<Request, Response> = makeHooksLifeCycle();
	public extracted: RouteExtractObj = {};
	public steps: (CheckerStep | ProcessStep | CutStep)[] = [];
	public errorExtract: ErrorExtractFunction<Response> = (response, type, index, err) => {
		response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send();
	};
	public descs: DescriptionAll[] = [];
	public handlerFunction?: RoutehandlerFunction<any, any>;
	public processFunction: ProcessFunction = () => ({});
	public editingFunctions: EditingFunctionProcess[] = [];
	public extensions: Record<string, any> = {};
	public stringFunction: string = "";
	public drop: drop[] = [];
	public options?: options;
	public input?: ((pickup: Floor<Record<string, unknown>>["pickup"]) => input);

	constructor(
		public name: string,
	)
	{}

	setExtract(extractObj: RouteExtractObj, error: ErrorExtractFunction<Response> | undefined, desc: any[]){
		this.extracted = extractObj;
		if(error){
			this.errorExtract = error;
		}

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

		this.stringFunction = processFunctionString(
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
					!!this.handlerFunction,
					() => handlerFunctionString(
						this.handlerFunction?.constructor.name === "AsyncFunction"
					)
				)
			),
			this.drop || []
		);

		this.editingFunctions.forEach(editingFunction => editingFunction(this));

		this.processFunction = eval(this.stringFunction).bind({
			extracted: this.extracted,
			errorExtract: this.errorExtract,
			steps: this.steps, 
			handlerFunction: this.handlerFunction,
			extensions: this.extensions,

			ZodError,
			makeFloor,
		});
	}
}
