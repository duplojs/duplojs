import {Response} from "../response";
import {DescriptionAll, PromiseOrNot} from "../utility";
import {RoutehandlerFunction} from "./route";

export type CheckerOutput<
	info extends string = string, 
	data extends unknown = unknown
> = {
	info: info,
	data: data,
};

export type CheckerGetParmas<checker extends Checker> = 
	checker extends Checker<
		infer options,
		infer input,
		infer output
	> 
	? {options: options, input: input, output: output} 
	: never

export interface CheckerOutputFunction{
	<
		info extends string,
		data extends unknown = undefined,
	>(info: info, data: data): CheckerOutput<info, data>;
}

export type CheckerHandler<
	input extends any, 
	outputHandler extends CheckerOutput
> = (input: input, output: CheckerOutputFunction, options: any) => PromiseOrNot<outputHandler>;

export interface CheckerPreComplated<
	outputHandler extends CheckerOutput,
	result extends CheckerOutput["info"],
	indexing extends string
>{
	result?: (result & outputHandler["info"]) | (result[] & outputHandler["info"][]),
	indexing?: indexing,
}

export class Checker<
	options extends Record<string, any> = any,
	input extends unknown = any,
	outputHandler extends CheckerOutput = CheckerOutput,
	allPreCompleted extends Record<string, any> = {},
>{
	public options = {} as options;
	public handler: CheckerHandler<input, outputHandler> = () => ({} as any);
	public precomplete = {} as allPreCompleted;
	public descs: DescriptionAll[] = [];

	constructor(
		public name: string,
	){}

	setOptions(options: any, desc: any[]){
		this.options = options;

		this.addDesc("options", desc);
	}

	setHandler(handlerFunction: CheckerHandler<input, outputHandler>, desc: any[]){
		this.handler = handlerFunction;

		this.addDesc("handler", desc);
	}

	addPrecompleted(name: string, params: CheckerPreComplated<any, any, any>, desc: any[]){
		(this.precomplete as any)[name] = params;

		this.addDesc("precomplete", desc);
	}

	addDesc(type: DescriptionAll["type"], desc: any[]){
		if(desc.length !== 0){
			this.descs.push({
				type: (type as any), 
				descStep: desc
			});
		}
	}
}
