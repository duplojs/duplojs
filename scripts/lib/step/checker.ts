import {Step} from ".";
import {Checker, CheckerGetParmas} from "../duplose/checker";
import {Response} from "../response";
import {AnyFunction, Floor} from "../utile";

export interface CheckerParamsStep<
	checker extends Checker, 
	response extends Response,
	floor extends {},
	info extends string,
	index extends string,
	checkerParams extends CheckerGetParmas<checker> = CheckerGetParmas<checker>
>{
	input(pickup: Floor<floor>["pickup"]): checkerParams["input"];
	result?: (info & checkerParams["output"]["info"]) | (info[] & checkerParams["output"]["info"][]);
	indexing?: index & string;
	catch(
		response: response, 
		info: Exclude<checkerParams["output"], {info: info}>["info"], 
		data: Exclude<checkerParams["output"], {info: info}>["data"],
		pickup: Floor<floor>["pickup"]
	): void;
	options?: Partial<checkerParams["options"]> | ((pickup: Floor<floor>["pickup"]) => Partial<checkerParams["options"]>);
}

export class CheckerStep extends Step{
	/* istanbul ignore next */ 
	public handler: AnyFunction = () => {};
	public options: Record<string, any> | AnyFunction = {};
	/* istanbul ignore next */ 
	public input: AnyFunction = () => {};
	/* istanbul ignore next */ 
	public catch: AnyFunction = () => {};
	public skip?: AnyFunction;
	public result?: string | string[];
	public indexing?: string;

	constructor(
		public checker: Checker,
		public params: CheckerParamsStep<any, any, any, any, any> & {skip?: AnyFunction}
	){
		super(checker.name);
	}
	
	build(){
		if(this.params.options){
			if(typeof this.params.options === "function") this.options = (pickup: any) => ({
				...this.checker.options,
				...(this.params.options as AnyFunction)(pickup)
			});
			else this.options = {...this.checker.options, ...this.params.options};
		}
		else this.options = this.checker.options;

		this.result = this.params.result;
		this.indexing = this.params.indexing;
		this.input = this.params.input;
		this.catch = this.params.catch;
		this.skip = this.params.skip;
		this.handler = this.checker.handler;
	}
}
