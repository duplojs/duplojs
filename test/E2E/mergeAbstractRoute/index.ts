import {workerTesting} from "@duplojs/worker-testing";

export default workerTesting(
	__dirname + "/route.ts",
	[
		{
			title: "pickup merge abstract",
			url: "http://localhost:1506/mergeAbstract/test/1",
			method: "GET",
			output: [
				"deepAbstract pickup test 57",
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
		}
	]
);
