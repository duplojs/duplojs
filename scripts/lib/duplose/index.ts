import {ZodError, ZodType} from "zod";
import {Hook, HooksLifeCycle, makeHooksLifeCycle} from "../hook";
import {Request} from "../request";
import {Response} from "../response";
import {CheckerStep} from "../step/checker";
import {CutStep} from "../step/cut";
import {ProcessStep} from "../step/process";
import {DescriptionAll, Floor} from "../utile";
import {DuploConfig} from "../duploInstance";

export interface ExtractObject{
	body?: Record<string, ZodType> | ZodType,
	params?: Record<string, ZodType> | ZodType,
	query?: Record<string, ZodType> | ZodType,
	headers?: Record<string, ZodType> | ZodType,
}

export type HandlerFunction<
	response extends Response, 
	floor extends {},
> = (floor: Floor<floor>, response: response) => void;

export type ErrorExtractFunction<
	response extends Response
> = (
	response: response, 
	type: keyof ExtractObject, 
	index: string, 
	err: ZodError
) => void

export abstract class Duplose<_duploseFunction, _editingDuploseFunctions>{
	public hooksLifeCyle: HooksLifeCycle<Request, Response> = makeHooksLifeCycle();
	public extracted: ExtractObject = {};
	/* istanbul ignore next */ 
	public errorExtract: ErrorExtractFunction<Response> = () => {};
	public steps: (CheckerStep | ProcessStep | CutStep)[] = [];
	public handler?: HandlerFunction<any, any>;

	public descs: DescriptionAll[] = [];
	public extensions: Record<string, any> = {};
	public stringDuploseFunction: string = "";
	/* istanbul ignore next */ 
	public duploseFunction: _duploseFunction = (() => {}) as any;
	public editingDuploseFunctions: _editingDuploseFunctions[] = [];

	public abstract get config(): DuploConfig;
	public abstract get defaultErrorExtract(): ErrorExtractFunction<Response>;

	constructor(desc: any[]){
		this.setExtract({}, undefined, []);
		this.addDesc("first", desc);
	}

	setExtract(extractObj: ExtractObject, error: ErrorExtractFunction<Response> | undefined, desc: any[]){
		this.extracted = extractObj;
		this.errorExtract = error || this.defaultErrorExtract;

		this.addDesc("extracted", desc);
	}

	addStepProcess(processStep: ProcessStep, desc: any[]){
		Object.keys(this.hooksLifeCyle).forEach((key) => {
			this.hooksLifeCyle[key].addSubscriber(
				processStep.parent.hooksLifeCyle[key] as Hook,
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

	setHandler(handler: HandlerFunction<Response, {}>, desc: any[]){
		this.handler = handler;

		this.addDesc("handler", desc);
	}

	addDesc(type: Exclude<DescriptionAll["type"], "cut" | "checker" | "process">, desc: any[]){
		if(desc.length !== 0){
			this.descs.push({
				type: type, 
				descStep: desc
			});
		}
	}

	abstract build(): void
}
