import {Step} from ".";
import {Request} from "../request";
import {Response} from "../response";
import {Floor, PromiseOrNot} from "../utils";

export type CutFunction<
	request extends Request, 
	response extends Response,
	floor extends {},
	returnFloor extends Record<string, unknown>,
> = (floor: Floor<floor>, response: response, request: request) => PromiseOrNot<returnFloor>;

export class CutStep extends Step<CutFunction<Request, Response, any, any>>{
	constructor(
		short: CutFunction<Request, Response, any, any>,
		public drop: string[]
	){
		super("cut", short);
	}

	build(){}
}
