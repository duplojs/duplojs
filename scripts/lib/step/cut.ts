import {Step} from ".";
import {Floor} from "../floor";
import {Request} from "../request";
import {Response} from "../response";
import {PromiseOrNot} from "../utile";

export type CutFunction<
	request extends Request, 
	response extends Response,
	returnFloor extends Record<string, unknown>,
	floor extends {},
> = (floor: Floor<floor>, response: response, request: request) => PromiseOrNot<returnFloor | undefined | void>;

export class CutStep extends Step{
	constructor(
		public short: CutFunction<Request, Response, any, any>,
		public drop: string[]
	){
		super("cut");
	}

	build(){}
}
