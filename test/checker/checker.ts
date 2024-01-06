import {DuploConfig, DuploInstance} from "../../scripts/index";
import {parentPort} from "worker_threads";

export const IsOdd = (duplo: DuploInstance<DuploConfig>) => 
	duplo
	.createChecker("isOdd")
	.defineOptions({
		result: 0
	})
	.handler((number: number, output, options) => {
		if(number % 2 === 0){
			parentPort?.postMessage("checker result odd");
			return output("odd", options.result);
		}
		else {
			parentPort?.postMessage("checker result not odd");
			return output("notOdd", null);
		}
	})
	.addPrecompleted(
		"wantOdd",
		{
			result: "odd",
			catch: (res, info, data) => {
				res.code(403).info(info).send("wrong");
			}, 
			indexing: "number",
		}
	)
	.addPrecompleted(
		"wantNotOdd",
		{
			result: "notOdd",
			indexing: "notOddResult"
		}
	)
	.build();
