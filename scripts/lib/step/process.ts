import {Step} from ".";
import {Process} from "../duplose/process";
import {AnyFunction, Floor} from "../utils";

export interface ProcessParamsStep<
	process extends Process,
	pickup extends string,
	floor extends {},
>{
	options?: Partial<process["options"]> | ((pickup: Floor<floor>["pickup"]) => Partial<process["options"]>);
	pickup?: process["drop"] & pickup[];
	input?: (pickup: Floor<floor>["pickup"]) => ReturnType<Exclude<process["input"], undefined>>;
}

export class ProcessStep extends Step<Process>{
	options: Record<string, any> | AnyFunction = {};
	/* istanbul ignore next */
	input?: AnyFunction = () => undefined;
	/* istanbul ignore next */ 
	processFunction: AnyFunction = () => {};
	pickup?: string[];
	skip?: AnyFunction;

	constructor(
		process: Process,
		public params: ProcessParamsStep<any, any, any> & {skip?: AnyFunction}
	){
		super(process.name, process);
	}

	build(){
		if(this.params.options){
			if(typeof this.params.options === "function") this.options = (pickup: any) => ({
				...this.parent.options,
				...(this.params.options as AnyFunction)(pickup)
			});
			else this.options = {...this.parent.options, ...this.params.options};
		}
		else this.options = this.parent.options;

		this.skip = this.params.skip;
		this.pickup = this.params.pickup;
		this.input = this.params.input || this.parent?.input;
		this.processFunction = this.parent.duploseFunction;
	}
}
