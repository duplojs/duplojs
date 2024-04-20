import {Step} from ".";
import {Request} from "../request";
import {Response} from "../response";
import {FixedFloor, Floor, PromiseOrNot} from "../utils";

export type CutFunction<
	request extends Request, 
	response extends Response,
	floorValues extends {},
	returnFloorValues extends Record<string, unknown>,
> = (floor: FixedFloor<Floor<floorValues>>["fix"], response: response, request: request) => PromiseOrNot<returnFloorValues>;

export class CutStep extends Step<CutFunction<Request, Response, any, any>>{
	constructor(
		short: CutFunction<Request, Response, any, any>,
		public drop: string[]
	){
		super("cut", short);
	}

	build(){}
}
