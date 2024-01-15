import {Duplose} from "..";
import {HooksLifeCycle, makeHooksLifeCycle} from "../../hook";
import {DuploConfig} from "../../main";
import {Request} from "../../request";
import {Response} from "../../response";
import {CheckerStep} from "../../step/checker";
import {CutStep} from "../../step/cut";
import {ProcessStep} from "../../step/process";
import {AnyFunction, DescriptionAll} from "../../utility";
import {ErrorExtractFunction, RouteExtractObj, RoutehandlerFunction} from "../route";

export type AbstractRouteFunction = (request: Request, response: Response, options: any) => Record<string, any> | Promise<Record<string, any>>;

export type EditingFunctionAbstractRoute = (abstractRoute: AbstractRoute) => void;

export abstract class AbstractRoute<
	options extends Record<string, any> = any,
	floor extends {} = {},
> extends Duplose{
	public hooksLifeCyle: HooksLifeCycle<Request, Response> = makeHooksLifeCycle();
	public extracted: RouteExtractObj = {};
	public errorExtract: ErrorExtractFunction<Response> = () => {};
	public steps: (CheckerStep | ProcessStep | CutStep)[] = [];
	public handlerFunction?: RoutehandlerFunction<any, any>;
	public abstractRouteFunction: AbstractRouteFunction = () => ({});
	public editingFunctions: EditingFunctionAbstractRoute[] = [];
	public extensions: Record<string, any> = {};
	public stringFunction: string = "";
	public drop: string[] = [];
	public options?: options;

	public abstract get config(): DuploConfig;
	public abstract get defaultErrorExtract(): ErrorExtractFunction<Response>;
	
	constructor(
		public name: string,
		public parentAbstractRoute: AbstractRoute | undefined,
		desc: any[],
	){	
		this.setExtract({}, undefined, []);
		if(parentAbstractRoute){
			Object.keys(this.hooksLifeCyle).forEach((key) => {
				this.hooksLifeCyle[key].copySubscriber(
					parentAbstractRoute.hooksLifeCyle[key].subscribers as AnyFunction[]
				);
			});
			parentAbstractRoute.descs.push(...parentAbstractRoute.descs);
		}
		this.addDesc("first", desc);
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

	setDrop(drop: any[], desc: any[]){
		this.drop = drop || [];
			
		this.addDesc("build", desc);
	}

	setOptions(options: any, desc: any[]){
		this.options = options;

		this.addDesc("options", desc);
	}

	addDesc(
		type: Exclude<DescriptionAll["type"], "cut" | "checker" | "process">, 
		desc: any[]
	){
		if(desc.length !== 0){
			this.descs.push({
				type, 
				descStep: desc
			});
		}
	}
}
