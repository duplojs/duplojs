import {zod} from "../../scripts";
import {workerTesting} from "@duplojs/worker-testing";

export default workerTesting(
	__dirname + "/route.ts",
	[
		{
			title: "hello-world",
			url: "http://localhost:1506/route/test/1",
			method: "GET",
			response: {
				code: 200,
				info: "s",
				body: zod.literal("hello-world"),
			}
		},
		{
			title: "match with query",
			url: "http://localhost:1506/route/test/1",
			method: "GET",
			query: {
				test: 1
			},
			response: {
				code: 200,
				info: "s",
				body: zod.literal("hello-world"),
			}
		},
		{
			title: "params and extract",
			url: "http://localhost:1506/route/test/2/superTest",
			method: "GET",
			response: {
				code: 200,
				info: "superTest",
			}
		},
		{
			title: "not found custom",
			url: "http://localhost:1506/route",
			method: "GET",
			output: ["matched path null"],
			response: {
				code: 404,
				info: "notfound",
			}
		},
		{
			title: "send object",
			url: "http://localhost:1506/route/test/3",
			method: "GET",
			response: {
				code: 200,
				info: "s",
				body: zod.object({test: zod.number()}).strict()
			}
		},
		{
			title: "post text",
			url: "http://localhost:1506/route/test/4",
			method: "POST",
			body: "test post text body",
			response: {
				code: 200,
				info: "s",
				body: zod.literal("test post text body"),
			}
		},
		{
			title: "put object",
			url: "http://localhost:1506/route/test/5",
			method: "PUT",
			headers: {"content-type": "application/json"},
			body: {test: 1},
			response: {
				code: 200,
				info: "s",
				body: zod.object({test: zod.number()}).strict(),
			}
		},
		{
			title: "custom error",
			url: "http://localhost:1506/route/test/6",
			method: "GET",
			output: ["error message my error"],
			response: {
				code: 500,
				info: "error",
			}
		},
	]
);
