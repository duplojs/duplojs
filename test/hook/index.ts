import {test} from "../testing";

export default test(
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

				"global beforeParsingBody",
				"abstract beforeParsingBody",
				"process beforeParsingBody",
				"deepProcess beforeParsingBody",
				"deepAbstract beforeParsingBody",
				"local beforeParsingBody",
				"process beforeParsingBody",
				"deepProcess beforeParsingBody",

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
	]
);
