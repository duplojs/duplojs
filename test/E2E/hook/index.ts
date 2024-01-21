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
				"global onConstructRequest",
				"abstract onConstructRequest",
				"process onConstructRequest",
				"deepProcess onConstructRequest",
				"deepAbstract onConstructRequest",
				"local onConstructRequest",
				"process onConstructRequest",
				"deepProcess onConstructRequest",

				"global onConstructResponse",
				"abstract onConstructResponse",
				"process onConstructResponse",
				"deepProcess onConstructResponse",
				"deepAbstract onConstructResponse",
				"local onConstructResponse",
				"process onConstructResponse",
				"deepProcess onConstructResponse",

				"global beforeRouteExecution",
				"abstract beforeRouteExecution",
				"process beforeRouteExecution",
				"deepProcess beforeRouteExecution",
				"deepAbstract beforeRouteExecution",
				"local beforeRouteExecution",
				"process beforeRouteExecution",
				"deepProcess beforeRouteExecution",

				"global parsingBody",
				"abstract parsingBody",
				"process parsingBody",
				"deepProcess parsingBody",
				"deepAbstract parsingBody",
				"local parsingBody",
				"process parsingBody",
				"deepProcess parsingBody",

				"global onError",
				"abstract onError",
				"process onError",
				"deepProcess onError",
				"deepAbstract onError",
				"local onError",
				"process onError",
				"deepProcess onError",

				"global beforeSend",
				"abstract beforeSend",
				"process beforeSend",
				"deepProcess beforeSend",
				"deepAbstract beforeSend",
				"local beforeSend",
				"process beforeSend",
				"deepProcess beforeSend",

				"global afterSend",
				"abstract afterSend",
				"process afterSend",
				"deepProcess afterSend",
				"deepAbstract afterSend",
				"local afterSend",
				"process afterSend",
				"deepProcess afterSend",
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
	]
);
