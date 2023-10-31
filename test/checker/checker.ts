import {DuploConfig, DuploInstance} from "../../scripts/index";
import {parentPort} from "worker_threads";

export const IsOdd = (duplo: DuploInstance<DuploConfig>) => duplo.createChecker(
	"isOdd",
	{
		handler(number: number, output, options){
			if(number % 2 === 0){
				parentPort?.postMessage("checker result odd");
				return output("odd", options.result);
			}
			else {
				parentPort?.postMessage("checker result not odd");
				return output("notOdd", null);
			}
		},
		outputInfo: ["odd", "notOdd"],
		options: {
			result: 0
		}
	}
);
