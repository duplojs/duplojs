import {zod} from "../../scripts";
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
			output: ["checker result not odd"],
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
			title: "abstract ignore prefix",
			url: "http://localhost:1506/abstract/test/4",
			method: "GET",
			output: [],
			response: {
				code: 204,
				info: "result"
			}
		},
		{
			title: "abstract prefix",
			url: "http://localhost:1506/pre/abstract/test/4",
			method: "GET",
			output: [],
			response: {
				code: 200,
				info: "result"
			}
		},
		{
			title: "abstract exit",
			url: "http://localhost:1506/abstract/test/5",
			method: "GET",
			output: [],
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
		{
			title: "deepAbstract prefix and ignore abstract prefix",
			url: "http://localhost:1506/pre/abstract/test/7",
			method: "GET",
			response: {
				code: 204,
				info: "result"
			}
		},
		{
			title: "deepAbstract prefix and abstract prefix",
			url: "http://localhost:1506/pre/pre/abstract/test/8",
			method: "GET",
			response: {
				code: 204,
				info: "result"
			}
		},
	]
);
