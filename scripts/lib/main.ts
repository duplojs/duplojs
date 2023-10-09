import http from "http";
import {AddHooksLifeCycle, AddServerHooksLifeCycle, makeHooksLifeCycle, makeServerHooksLifeCycle} from "./hook.ts";
import {Request} from "./request.ts";
import {__exec__, Response} from "./response.ts";
import makeRoutesSystem from "./route.ts";
import makeCheckerSystem from "./checker.ts";
import correctPath from "./correctPath.ts";
import makeProcessSystem from "./process.ts";
import makeContentTypeParserSystem from "./contentTypeParser.ts";
import {AnyFunction} from "./utility.ts";
import {DeclareAbstractRoute} from "./abstractRoute.ts";

declare module "http"{
	interface IncomingMessage{
		params: Record<string, string>
	}
}

export interface DuploConfig{
	port: number,
	host: string,
	onLaunch?: () => void;
	onClose?: () => void;
	prefix?: string;
}
export interface DuploInstance<duploConfig extends DuploConfig> {
	Request: typeof Request;
	Response: typeof Response;
	server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
	config: duploConfig;
	launch(onReady?: () => void): DuploInstance<duploConfig>["server"];
	addHook: AddHooksLifeCycle<DuploInstance<duploConfig>>["addHook"] & AddServerHooksLifeCycle<DuploInstance<duploConfig>>["addHook"];
	declareRoute: ReturnType<typeof makeRoutesSystem>["declareRoute"];
	createChecker: ReturnType<typeof makeCheckerSystem>["createChecker"];
	setNotfoundHandler: ReturnType<typeof makeRoutesSystem>["setNotfoundHandler"];
	setErrorHandler: ReturnType<typeof makeRoutesSystem>["setErrorHandler"];
	createProcess: ReturnType<typeof makeProcessSystem>["createProcess"];
	addContentTypeParsers: ReturnType<typeof makeContentTypeParserSystem>["addContentTypeParsers"];
	declareAbstractRoute: ReturnType<typeof makeRoutesSystem>["declareAbstractRoute"];
	mergeAbstractRoute: ReturnType<typeof makeRoutesSystem>["mergeAbstractRoute"];
	use<
		duploInputFunction extends ((instance: DuploInstance<duploConfig>, options: any) => any)
	>(input: duploInputFunction, options?: Parameters<duploInputFunction>[1]): ReturnType<duploInputFunction>
}

export default function Duplo<duploConfig extends DuploConfig>(config: duploConfig): DuploInstance<duploConfig>{
	config.prefix = correctPath(config.prefix || "");
	if(config.prefix === "/")config.prefix = "";

	const hooksLifeCyle = makeHooksLifeCycle();
	const serverHooksLifeCycle = makeServerHooksLifeCycle();

	const {addContentTypeParsers, buildContentTypeBody, parseContentTypeBody} = makeContentTypeParserSystem();
	const {createChecker} = makeCheckerSystem(serverHooksLifeCycle);
	const {createProcess} = makeProcessSystem(serverHooksLifeCycle);
	const {
		declareRoute, 
		buildRoute, 
		findRoute, 
		setNotfoundHandler, 
		setErrorHandler, 
		declareAbstractRoute,
		mergeAbstractRoute,
	} = makeRoutesSystem(config, hooksLifeCyle, serverHooksLifeCycle, parseContentTypeBody);

	const server = http.createServer( 
		async(serverRequest, serverResponse) => {
			try {
				const {routeFunction, params} = findRoute(serverRequest.method as Request["method"], serverRequest.url as string);

				serverRequest.params = params;
				await routeFunction(new Request(serverRequest, config), new Response(serverResponse, config));
			}
			catch (error){
				serverHooksLifeCycle.onServerError.launchSubscriber(error as Error);
			}
		}
	);

	const addHook: AddHooksLifeCycle<typeof duploInstance>["addHook"] & AddServerHooksLifeCycle<typeof duploInstance>["addHook"] = (name, hookFunction) => {
		if(hooksLifeCyle[name as keyof typeof hooksLifeCyle])hooksLifeCyle[name as keyof typeof hooksLifeCyle].addSubscriber(hookFunction as any);
		else if(serverHooksLifeCycle[name as keyof typeof serverHooksLifeCycle])serverHooksLifeCycle[name as keyof typeof serverHooksLifeCycle].addSubscriber(hookFunction as any);
		return duploInstance;
	};

	const duploInstance: DuploInstance<duploConfig> = {
		Request,
		Response,
		server,
		config,
		launch(onLaunch = () => console.log("Ready !")){
			buildRoute();
			buildContentTypeBody();

			serverHooksLifeCycle.onServerError.addSubscriber((error) => console.error(error));
			server.on("error", serverHooksLifeCycle.onServerError.launchSubscriber);

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
		declareAbstractRoute,
		mergeAbstractRoute,
		use(input, options){
			return input(duploInstance, options);
		}
	};

	return duploInstance; 
}
