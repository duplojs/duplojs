import EventEmitter from "events";
import {DuploInstance} from "../../../scripts";
import {parsingBody} from "../../../scripts/lib/defaultHooks/parsingBody";
import {serializeFile} from "../../../scripts/lib/defaultHooks/serializeFile";
import {serializeJSON} from "../../../scripts/lib/defaultHooks/serializeJSON";
import {serializeString} from "../../../scripts/lib/defaultHooks/serializeString";
import {makeMokedRequest} from "../mocks/request";
import {makeMokedResponse} from "../mocks/response";

it("duploInstance", async() => {
	const saveProcess = process;
	class MyEmitter extends EventEmitter{
		exit(){}
	}
	const myEmitter = new MyEmitter();
	//@ts-ignore
	process = myEmitter;
	const savedLog = console.log;
	// console.log = () => {};
	const savedErrorLog = console.error;
	console.error = () => {};

	const duplo = new DuploInstance({
		port: 1506, 
		environment: "DEV", 
		host: "localhost", 
		onClose: () => {},
		onLaunch: () => {},
		globals: true
	});

	//@ts-ignore
	expect(global.duplo).toBe(duplo);

	const fnc1 = () => {};

	duplo.setDefaultErrorExtract(fnc1);

	expect(duplo.class.Route.editableProperty.defaultErrorExtract).toBe(fnc1);
	expect(duplo.class.Process.editableProperty.defaultErrorExtract).toBe(fnc1);
	expect(duplo.class.AbstractRoute.editableProperty.defaultErrorExtract).toBe(fnc1);

	duplo.addHook("afterSend", fnc1);
	duplo.addHook("onCreateChecker", fnc1);

	expect(duplo.class.hooksLifeCyle.afterSend.hasSubscriber(fnc1)).toBe(true);
	expect(duplo.class.serverHooksLifeCycle.onCreateChecker.hasSubscriber(fnc1)).toBe(true);
	
	const abstract = duplo.declareAbstractRoute("test");
	const route = duplo.declareRoute("POST", []).extract({body: {}}).handler(() => {});
	
	await duplo.launch();

	expect(route.hooksLifeCyle.parsingBody.hasSubscriber(parsingBody)).toBe(true);
	expect(route.hooksLifeCyle.serializeBody.hasSubscriber(serializeJSON)).toBe(true);
	expect(route.hooksLifeCyle.serializeBody.hasSubscriber(serializeString)).toBe(true);
	expect(route.hooksLifeCyle.serializeBody.hasSubscriber(serializeFile)).toBe(true);

	duplo.use((instance) => expect(instance).instanceof(DuploInstance));

	duplo.advancedUse(
		(instance, options: {test1?: string, test2?: number}) => {
			expect(options).toStrictEqual({
				test1: "zzz",
				test2: 2
			});
		},
		{
			default: {
				test1: "test",
			},
			DEV: {
				test1: "zzz",
				test2: 2
			}
		}
	);

	console.error = () => {};

	const {rawRequest, request} = makeMokedRequest({method: "GET", url: "/", matchedPath: "/"});
	const {rawResponse, response} = makeMokedResponse();
	duplo.class.serverHooksLifeCycle.onServerError.launchSubscriber(rawRequest, rawResponse, undefined as any);

	//@ts-ignore
	process.emit("uncaughtException", response, "");
	//@ts-ignore
	process.emit("uncaughtException", null, "");
	//@ts-ignore
	process.emit("uncaughtException", new Error(), "");

	process = saveProcess;
	
	duplo.server.emit("request", rawRequest, rawResponse);
	
	{
		const {rawResponse, response} = makeMokedResponse();
		//@ts-ignore
		duplo.findRoute = () => {
			throw response;
		};
		duplo.server.emit("request", rawRequest, rawResponse);
	}
	
	{
		const {rawResponse, response} = makeMokedResponse();
		//@ts-ignore
		duplo.findRoute = () => {
			throw new String();
		};
		duplo.server.emit("request", rawRequest, rawResponse);
	}

	console.log = savedLog;
	console.error = savedErrorLog;
});
