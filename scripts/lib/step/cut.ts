import {Step} from ".";
import {Request} from "../request";
import {Response} from "../response";
import {CutFunction} from "./process";

export class CutStep extends Step{
	constructor(
		public short: CutFunction<Request, Response, any, any>,
		public drop: string[]
	){
		super("cut");
	}

	build(){}
}
