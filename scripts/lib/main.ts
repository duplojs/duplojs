import http from "http";
import {AddHooksLifeCycle, makeHooksLifeCycle} from "./hook.ts";
import Request from "./request.ts";
import Response, {__exec__} from "./response.ts";
import makeRoutesSystem from "./route.ts";
import makeCheckerSystem from "./checker.ts";
import correctPath from "./correctPath.ts";
import makeProcessSystem from "./process.ts";
import makeContentTypeParserSystem from "./contentTypeParser.ts";

declare module "http"{
	interface IncomingMessage{
		params: Record<string, string>
	}
}

export interface duploConfig{
	port: number,
	host: string,
	callback?: () => void;
	prefix?: string;
}

export default function Duplo(config: duploConfig){
	config.prefix = correctPath(config.prefix || "");
	if(config.prefix === "/")config.prefix = "";

	const hooksLifeCyle = makeHooksLifeCycle();

	const {addContentTypeParsers, buildContentTypeBody, parseContentTypeBody} = makeContentTypeParserSystem();
	const {createChecker} = makeCheckerSystem();
	const {createProcess} = makeProcessSystem();
	const {declareRoute, buildRoute, findRoute, setNotfoundHandler, setErrorHandler} = makeRoutesSystem(config, hooksLifeCyle, parseContentTypeBody);

	const server = http.createServer( 
		async(serverRequest, serverResponse) => {
			try {
				const {routeFunction, params} = findRoute(serverRequest.method as Request["method"], serverRequest.url as string);

				serverRequest.params = params;
				await routeFunction(new Request(serverRequest, config), new Response(serverResponse, config));
			}
			catch (error){
				console.error(error);
			}
		}
	);

	const addHook: AddHooksLifeCycle["addHook"] = (name, hookFunction) => {
		hooksLifeCyle[name].addSubscriber(hookFunction as any);
	};

	return {
		server,
		config,
		launch(callback = () => console.log("Ready !")){
			buildRoute();
			buildContentTypeBody();

			return server.listen(
				config.port, 
				config.host,
				0,
				config.callback || callback,
			);
		},
		addHook,
		declareRoute,
		createChecker,
		setNotfoundHandler,
		setErrorHandler,
		createProcess,
		addContentTypeParsers
	}; 
}
