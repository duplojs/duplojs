import {Response} from "../response";
import {DescriptionAll, Floor, PromiseOrNot} from "../utile";

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

export type CheckerCatchFunction<
	outputHandler extends CheckerOutput,
	result extends CheckerOutput["info"],
> = (
	response: Response, 
	info: Exclude<outputHandler, {info: result}>["info"], 
	data: Exclude<outputHandler, {info: result}>["data"],
	pickup: Floor<Record<string, unknown>>["pickup"]
) => void

export interface CheckerPrecompletion<
	outputHandler extends CheckerOutput,
	result extends CheckerOutput["info"],
	indexing extends string
>{
	result?: (result & outputHandler["info"]) | (result[] & outputHandler["info"][]),
	indexing?: indexing,
	catch?: CheckerCatchFunction<outputHandler, result>,
}

export class Checker<
	options extends Record<string, any> = any,
	input extends unknown = any,
	outputHandler extends CheckerOutput = CheckerOutput,
	_preCompletions extends Record<string, any> = {},
>{
	public options = {} as options;
	/* istanbul ignore next */ 
	public handler: CheckerHandler<input, outputHandler> = () => ({} as any);
	public preCompletions = {} as _preCompletions;
	public descs: DescriptionAll[] = [];

	constructor(
		public name: string,
		desc: any[]
	){
		this.addDesc("first", desc);
	}

	setOptions(options: any, desc: any[]){
		this.options = options;

		this.addDesc("options", desc);
	}

	setHandler(handlerFunction: CheckerHandler<input, outputHandler>, desc: any[]){
		this.handler = handlerFunction;

		this.addDesc("handler", desc);
	}

	preCompletion(name: string, params: CheckerPrecompletion<any, any, any>, desc: any[]){
		(this.preCompletions as any)[name] = params;

		this.addDesc("precompletion", desc);
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
