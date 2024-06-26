import {Step} from ".";
import {Checker, CheckerGetParmas} from "../duplose/checker";
import {Response} from "../response";
import {AnyFunction, Floor} from "../utils";

export interface CheckerParamsStep<
	checker extends Checker, 
	response extends Response,
	floorValues extends {},
	info extends string,
	index extends string,
	checkerParams extends CheckerGetParmas<checker> = CheckerGetParmas<checker>
>{
	input(pickup: Floor<floorValues>["pickup"]): checkerParams["input"];
	result?: (info & checkerParams["output"]["info"]) | (info[] & checkerParams["output"]["info"][]);
	indexing?: index & string;
	catch(
		response: response, 
		info: Exclude<checkerParams["output"], {info: info}>["info"], 
		data: Exclude<checkerParams["output"], {info: info}>["data"],
		pickup: Floor<floorValues>["pickup"]
	): void;
	options?: Partial<checkerParams["options"]> | ((pickup: Floor<floorValues>["pickup"]) => Partial<checkerParams["options"]>);
}

export class CheckerStep extends Step<Checker>{
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
		checker: Checker,
		public params: CheckerParamsStep<any, any, any, any, any> & {skip?: AnyFunction}
	){
		super(checker.name, checker);
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

		this.result = this.params.result;
		this.indexing = this.params.indexing;
		this.input = this.params.input;
		this.catch = this.params.catch;
		this.skip = this.params.skip;
		this.handler = this.parent.handler;
	}
}
