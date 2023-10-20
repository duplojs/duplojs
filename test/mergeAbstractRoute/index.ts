import {zod} from "../../scripts";
import {test} from "../testing";

export default test(
	__dirname + "/route.ts",
	[
		{
			title: "pickup merge abstract",
			url: "http://localhost:1506/mergeAbstract/test/1",
			method: "GET",
			output: [
				"deepAbstract pickup test 57",
				"deepAbstract pickup test1 test",
				"mergeAbstract pickup test 57",
				"mergeAbstract pickup yyy 1"
			],
			response: {
				code: 204,
				info: "result",
			}
		},
		{
			title: "options merge abstract",
			url: "http://localhost:1506/mergeAbstract/test/2",
			method: "GET",
			output: [
				"checker result odd",
				"abstract result 22",
				"process test custom",
				"process options1 40",
				"process options2 2",
				"process input 22",
				"abstract options test1 82",
				"abstract options test2 700",
			],
			response: {
				code: 204,
				info: "result",
			}
		},
		{
			title: "prefix",
			url: "http://localhost:1506/pre/pre/mergeAbstract/test/3",
			method: "GET",
			response: {
				code: 204,
				info: "result",
			}
		},
	]
);