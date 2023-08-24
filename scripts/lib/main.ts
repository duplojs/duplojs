import http from "http";
import {AddHooksLifeCycle, AddServerHooksLifeCycle, makeHooksLifeCycle, makeServerHooksLifeCycle} from "./hook.ts";
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
	onLaunch?: () => void;
	onClose?: () => void;
	prefix?: string;
}

export default function Duplo(config: duploConfig){
	config.prefix = correctPath(config.prefix || "");
	if(config.prefix === "/")config.prefix = "";

	const hooksLifeCyle = makeHooksLifeCycle();
	const serverHooksLifeCycle = makeServerHooksLifeCycle();
	let onServerError: ReturnType<typeof serverHooksLifeCycle.onServerError.build>;

	const {addContentTypeParsers, buildContentTypeBody, parseContentTypeBody} = makeContentTypeParserSystem();
	const {createChecker} = makeCheckerSystem(serverHooksLifeCycle);
	const {createProcess} = makeProcessSystem(serverHooksLifeCycle);
	const {
		declareRoute, 
		buildRoute, 
		findRoute, 
		setNotfoundHandler, 
		setErrorHandler, 
		declareAbstractRoute
	} = makeRoutesSystem(config, hooksLifeCyle, serverHooksLifeCycle, parseContentTypeBody);

	const server = http.createServer( 
		async(serverRequest, serverResponse) => {
			try {
				const {routeFunction, params} = findRoute(serverRequest.method as Request["method"], serverRequest.url as string);

				serverRequest.params = params;
				await routeFunction(new Request(serverRequest, config), new Response(serverResponse, config));
			}
			catch (error){
				onServerError(error as Error);
			}
		}
	);

	const addHook: AddHooksLifeCycle["addHook"] & AddServerHooksLifeCycle["addHook"] = (name, hookFunction) => {
		if(hooksLifeCyle[name as keyof typeof hooksLifeCyle])hooksLifeCyle[name as keyof typeof hooksLifeCyle].addSubscriber(hookFunction as any);
		else if(serverHooksLifeCycle[name as keyof typeof serverHooksLifeCycle])serverHooksLifeCycle[name as keyof typeof serverHooksLifeCycle].addSubscriber(hookFunction as any);
	};

	return {
		server,
		config,
		launch(onLaunch = () => console.log("Ready !")){
			buildRoute();
			buildContentTypeBody();

			serverHooksLifeCycle.onServerError.addSubscriber((error) => console.error(error));
			onServerError = serverHooksLifeCycle.onServerError.build();
			server.on("error", onServerError);

			const onReady = serverHooksLifeCycle.onReady.build();
			server.on("listening", onReady);
			server.on("listening", onLaunch);
			if(config.onLaunch)server.on("listening", config.onLaunch);

			const onClose = serverHooksLifeCycle.onClose.build();
			server.on("close", onClose);
			if(config.onClose)server.on("close", config.onClose);

			server.listen(config.port, config.host);
			return server;
		},
		addHook,
		declareRoute,
		createChecker,
		setNotfoundHandler,
		setErrorHandler,
		createProcess,
		addContentTypeParsers,
		declareAbstractRoute
	}; 
}
