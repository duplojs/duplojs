import {zod} from "../../scripts";
import {workerTesting} from "@duplojs/worker-testing";

export default workerTesting(
	__dirname + "/route.ts",
	[
		{
			title: "Error extract",
			url: "http://localhost:1506/checker/test/1",
			method: "GET",
			response: {
				code: 400,
				info: "TYPE_ERROR.query.number",
			}
		},
		{
			title: "Checker number is not odd",
			url: "http://localhost:1506/checker/test/1",
			method: "GET",
			query: {number: 1},
			output: ["checker result not odd"],
			response: {
				code: 400,
				info: "notOdd",
				body: zod.literal("wrong"),
			}
		},
		{
			title: "Checker number is odd",
			url: "http://localhost:1506/checker/test/1",
			method: "GET",
			query: {number: 2},
			output: ["checker result odd"],
			response: {
				code: 200,
				info: "odd",
				body: zod.literal("0"),
			}
		},
		{
			title: "Route skip checker",
			url: "http://localhost:1506/checker/test/1",
			method: "GET",
			query: {number: 1, skip: "true"},
			output: ["skip test"],
			response: {
				code: 204,
				info: "skipTest",
			}
		},
		{
			title: "Checker custom options",
			url: "http://localhost:1506/checker/test/2",
			method: "GET",
			output: ["checker result odd"],
			response: {
				code: 200,
				info: "odd",
				body: zod.literal("55"),
			}
		},
		{
			title: "Checker dynamic custom options",
			url: "http://localhost:1506/checker/test/3",
			method: "GET",
			query: {number: 67},
			output: ["checker result odd"],
			response: {
				code: 200,
				info: "odd",
				body: zod.literal("67"),
			}
		},
		{
			title: "Checker multie result",
			url: "http://localhost:1506/checker/test/4",
			method: "GET",
			output: ["checker result odd"],
			response: {
				code: 200,
				info: "odd",
				body: zod.literal("0"),
			}
		},
	]
);
