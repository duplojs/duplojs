import {zod} from "../../../scripts";
import {workerTesting} from "@duplojs/worker-testing";

export default workerTesting(
	__dirname + "/route.ts",
	[
		{
			title: "abstract extract error",
			url: "http://localhost:1506/abstract/test/1",
			method: "GET",
			response: {
				code: 400,
				info: "TYPE_ERROR.query.number"
			}
		},
		{
			title: "abstract extracted, checker, process and drop value",
			url: "http://localhost:1506/abstract/test/1",
			method: "GET",
			query: {number: 2},
			output: [
				"checker result odd",
				"process options1 1",
				"process options2 2",
				"process input 30",
				"abstract pickup number 2",
				"abstract pickup result 0",
				"abstract pickup right true"
			],
			response: {
				code: 204,
				info: "result"
			}
		},
		{
			title: "checker Error",
			url: "http://localhost:1506/abstract/test/1",
			method: "GET",
			query: {number: 1},
			output: ["checker result not odd", "result null", "pickup number 1"],
			response: {
				code: 400,
				info: "notOdd"
			}
		},
		{
			title: "abstract options and input process, checker",
			url: "http://localhost:1506/abstract/test/2",
			method: "GET",
			output: [
				"checker result odd",
				"abstract result 22",
				"process options1 40",
				"process options2 2",
				"process input 22",
				"abstract options test1 100",
				"abstract options test2 700"
			],
			response: {
				code: 204,
				info: "result"
			}
		},
		{
			title: "abstract dynamic options process, checker",
			url: "http://localhost:1506/abstract/test/3",
			method: "GET",
			query: {number: 480},
			output: [
				"checker result odd",
				"abstract result 480",
				"process options1 480",
				"process options2 2",
				"process input 30",
			],
			response: {
				code: 204,
				info: "result"
			}
		},
		{
			title: "deepAbstract pickup value",
			url: "http://localhost:1506/abstract/test/6",
			method: "GET",
			output: ["deepAbstract pickup test 57"],
			response: {
				code: 204,
				info: "result"
			}
		},
	]
);
