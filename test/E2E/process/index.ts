import {zod} from "../../../scripts";
import {workerTesting} from "@duplojs/worker-testing";

export default workerTesting(
	__dirname + "/route.ts",
	[
		{
			title: "Procces error extract",
			url: "http://localhost:1506/process/test/1",
			method: "GET",
			response: {
				code: 400,
				info: "TYPE_ERROR.headers.admin",
			}
		},
		{
			title: "Process return value to route",
			url: "http://localhost:1506/process/test/1",
			method: "GET",
			headers: {admin: true},
			output: [
				"checker result odd",
				"process options1 1",
				"process options2 2",
				"process input 30",
				"process test cut",
			],
			response: {
				code: 200,
				info: "result",
				body: zod.object({
					input: zod.literal(22),
					result: zod.literal(55),
					admin: zod.literal("true"),
					options: zod.object({
						testOption1: zod.literal("test1"),
    					testOption2: zod.literal("test2"),
					}).strict(),
					right: zod.literal(true)
				}).strict(),
			}
		},
		{
			title: "Process error checker",
			url: "http://localhost:1506/process/test/1",
			method: "GET",
			headers: {admin: true},
			query: {number: 3},
			output: ["checker result not odd", "result null", "pickup number 3"],
			response: {
				code: 400,
				info: "notOdd",
				body: zod.literal("wrong"),
			}
		},
		{
			title: "Route skip process",
			url: "http://localhost:1506/process/test/2",
			method: "GET",
			query: {skip: true},
			output: [],
			response: {
				code: 200,
				info: "result"
			}
		},
		{
			title: "Route no skip process and has error extract",
			url: "http://localhost:1506/process/test/2",
			method: "GET",
			output: [],
			response: {
				code: 400,
				info: "TYPE_ERROR.headers.admin"
			}
		},
		{
			title: "process skip checker and process",
			url: "http://localhost:1506/process/test/3",
			method: "GET",
			query: {skip: true},
			output: [],
			response: {
				code: 204,
				info: "result",
			}
		},
		{
			title: "process no skip checker and process",
			url: "http://localhost:1506/process/test/3",
			method: "GET",
			output: [
				"checker result odd",
				"process options1 1",
				"process options2 2",
				"process input 30",
			],
			response: {
				code: 204,
				info: "result",
			}
		},
		{
			title: "route and process input",
			url: "http://localhost:1506/process/test/4",
			method: "GET",
			query: {number: 35},
			output: [
				"process options1 1",
				"process options2 2",
				"process input 35",
			],
			response: {
				code: 204,
				info: "result",
			}
		},
		{
			title: "route and process options",
			url: "http://localhost:1506/process/test/5",
			method: "GET",
			output: [
				"process options 14",
				"process options1 1",
				"process options2 222",
				"process input 30",
			],
			response: {
				code: 204,
				info: "result",
			}
		},
		{
			title: "route, process and checker dynamic options",
			url: "http://localhost:1506/process/test/6",
			method: "GET",
			query: {number: 2},
			output: [
				"process options 2",
				"process options1 1",
				"process options2 7",
				"process input 30",
				"checker result odd",
				"checker result 2"
			],
			response: {
				code: 204,
				info: "result",
			}
		},
	]
);
