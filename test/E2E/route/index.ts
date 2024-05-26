import {readFileSync} from "fs";
import {zod} from "../../../scripts";
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
			title: "custom handler not found",
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
				info: undefined,
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
			title: "custom handler error",
			url: "http://localhost:1506/route/test/6",
			method: "GET",
			output: ["error message my error"],
			response: {
				code: 500,
				info: "error",
			}
		},
		{
			title: "cut drop",
			url: "http://localhost:1506/route/test/7",
			method: "GET",
			output: [],
			response: {
				code: 200,
				info: "s",
				body: zod.literal("15"),
			}
		},
		{
			title: "send file",
			url: "http://localhost:1506/route/test/8",
			method: "GET",
			output: [],
			response: {
				code: 200,
				info: "s",
				body: zod.literal(readFileSync(__dirname + "/../../../CONTRIBUTING.md", "utf-8")),
			}
		},
		{
			title: "send not found file",
			url: "http://localhost:1506/route/test/9",
			method: "GET",
			output: [],
			response: {
				code: 404,
				info: "FILE.NOTFOUND",
			}
		},
		{
			title: "async send",
			url: "http://localhost:1506/route/test/10",
			method: "GET",
			output: [],
			response: {
				code: 503,
				info: "NO_RESPONSE_SENT",
			}
		},
		{
			title: "send at wrong point",
			url: "http://localhost:1506/route/test/11",
			method: "GET",
			output: [],
			response: {
				code: 500,
				body: zod.literal("Error: Response interrupted the code from its context.")
			}
		},
		{
			title: "hook onConstructRequest",
			url: "http://localhost:1506/route/test/hook/onConstructRequest",
			method: "GET",
			output: ["hook onConstructRequest"],
			response: {
				code: 200,
				info: "s",
			}
		},
		{
			title: "hook onConstructResponse",
			url: "http://localhost:1506/route/test/hook/onConstructResponse",
			method: "GET",
			output: ["hook onConstructResponse"],
			response: {
				code: 200,
				info: "s",
			}
		},
		{
			title: "hook beforeRouteExecution",
			url: "http://localhost:1506/route/test/hook/beforeRouteExecution",
			method: "GET",
			output: ["hook beforeRouteExecution"],
			response: {
				code: 200,
				info: "s",
			}
		},
		{
			title: "hook parsingBody",
			url: "http://localhost:1506/route/test/hook/parsingBody",
			method: "GET",
			output: ["hook parsingBody"],
			response: {
				code: 200,
				info: "s",
			}
		},
		{
			title: "hook beforeSend",
			url: "http://localhost:1506/route/test/hook/beforeSend",
			method: "GET",
			output: ["hook beforeSend"],
			response: {
				code: 200,
				info: "s",
			}
		},
		{
			title: "hook afterSend",
			url: "http://localhost:1506/route/test/hook/afterSend",
			method: "GET",
			output: ["hook afterSend"],
			sleepAfterRequest: 100,
			response: {
				code: 200,
				info: "s",
			},
		},
		{
			title: "hook onError",
			url: "http://localhost:1506/route/test/hook/onError",
			method: "GET",
			output: ["hook onError", "error message test"],
			response: {
				code: 500,
				info: "error",
			}
		},
		{
			title: "set default error extract",
			url: "http://localhost:1506/route/test/12/error",
			method: "GET",
			response: {
				code: 400,
				body: zod.literal("error extract"),
			}
		},
		{
			title: "send string with custom header",
			url: "http://localhost:1506/route/test/13",
			method: "GET",
			response: {
				code: 200,
				headers: {
					"content-type": "text/html"
				},
				body: zod.literal("test"),
			}
		},
		{
			title: "send array",
			url: "http://localhost:1506/route/test/14",
			method: "GET",
			response: {
				code: 200,
				body: zod.string().array(),
			}
		},
		{
			title: "wrong content-type",
			url: "http://localhost:1506/route/test/4",
			method: "POST",
			headers: {"content-type": "application/json"},
			body: "test",
			response: {
				code: 500,
			}
		},
		{
			title: "find path with spécial chare",
			url: "http://localhost:1506/route/test/15 /ààà",
			method: "GET",
			response: {
				code: 200,
			}
		},
		{
			title: "find path with spécial chare",
			url: "http://localhost:1506/route/test/16/ ààà",
			method: "GET",
			response: {
				code: 200,
				body: zod.literal(" ààà")
			}
		},
	]
);
