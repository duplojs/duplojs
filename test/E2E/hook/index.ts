import {workerTesting} from "@duplojs/worker-testing";

export default workerTesting(
	__dirname + "/route.ts",
	[
		{
			title: "pickup merge abstract",
			url: "http://localhost:1506/hook/test/1",
			method: "GET",
			sleepAfterRequest: 100,
			output: [
				"local onConstructRequest",
				"process onConstructRequest",
				"deepProcess onConstructRequest",
				"abstract onConstructRequest",
				"deepAbstract onConstructRequest",
				"process onConstructRequest",
				"deepProcess onConstructRequest",
				"global onConstructRequest",

				"local onConstructResponse",
				"process onConstructResponse",
				"deepProcess onConstructResponse",
				"abstract onConstructResponse",
				"deepAbstract onConstructResponse",
				"process onConstructResponse",
				"deepProcess onConstructResponse",
				"global onConstructResponse",

				"local beforeRouteExecution",
				"process beforeRouteExecution",
				"deepProcess beforeRouteExecution",
				"abstract beforeRouteExecution",
				"deepAbstract beforeRouteExecution",
				"process beforeRouteExecution",
				"deepProcess beforeRouteExecution",
				"global beforeRouteExecution",

				"local parsingBody",
				"process parsingBody",
				"deepProcess parsingBody",
				"abstract parsingBody",
				"deepAbstract parsingBody",
				"process parsingBody",
				"deepProcess parsingBody",
				"global parsingBody",

				"local onError",
				"process onError",
				"deepProcess onError",
				"abstract onError",
				"deepAbstract onError",
				"process onError",
				"deepProcess onError",
				"global onError",

				"local beforeSend",
				"process beforeSend",
				"deepProcess beforeSend",
				"abstract beforeSend",
				"deepAbstract beforeSend",
				"process beforeSend",
				"deepProcess beforeSend",
				"global beforeSend",

				"local afterSend",
				"process afterSend",
				"deepProcess afterSend",
				"abstract afterSend",
				"deepAbstract afterSend",
				"process afterSend",
				"deepProcess afterSend",
				"global afterSend",
			],
			response: {
				code: 500,
				info: "INTERNAL_SERVER_ERROR",
			}
		},
		{
			title: "not found",
			url: "http://localhost:1506/hook",
			method: "GET",
			sleepAfterRequest: 100,
			output: [
				"global onConstructRequest",
				"global onConstructResponse",
				"global beforeRouteExecution",
				"global beforeSend",
				"global afterSend",
			],
			response: {
				code: 404,
				info: "NOTFOUND",
			}
		},
	],
	[
		"beforeBuildRouter",
		"afterBuildRouter",
		"beforeListenHttpServer",
		"onReady",
	]
);
