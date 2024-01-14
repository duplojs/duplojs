import {Step} from ".";
import {Process} from "../duplose/process";
import {Floor} from "../floor";
import {Request} from "../request";
import {Response} from "../response";
import {AnyFunction, PromiseOrNot} from "../utility";

export interface ProcessParamsStep<
	process extends Process,
	pickup extends string,
	floor extends {},
>{
	options?: Partial<process["options"]> | ((pickup: Floor<floor>["pickup"]) => Partial<process["options"]>);
	pickup?: process["drop"] & pickup[];
	input?: (pickup: Floor<floor>["pickup"]) => ReturnType<Exclude<process["input"], undefined>>;
}

export type CutFunction<
	request extends Request, 
	response extends Response,
	returnFloor extends {},
	floor extends {},
> = (floor: Floor<floor>, response: response, request: request) => PromiseOrNot<returnFloor | undefined | void>;

export class ProcessStep extends Step{
	options: Record<string, any> | AnyFunction = {};
	input?: AnyFunction = () => undefined;
	processFunction: AnyFunction = () => {};
	pickup?: string[];
	skip?: AnyFunction;

	constructor(
		public process: Process,
		public params: ProcessParamsStep<any, any, any> & {skip?: AnyFunction}
	){
		super(process.name);
	}

	build(){
		if(this.params.options){
			if(typeof this.params.options === "function") this.options = (pickup: any) => ({
				...this.process.options,
				...(this.params.options as AnyFunction)(pickup)
			});
			else this.options = {...this.process.options, ...this.params.options};
		}
		else this.options = this.process.options;

		this.skip = this.params.skip;
		this.pickup = this.params.pickup;
		this.input = this.params.input || this.process?.input;
		this.processFunction = this.process.processFunction;
	}
}
