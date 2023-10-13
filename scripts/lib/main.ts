import http from "http";
import {AddHooksLifeCycle, AddServerHooksLifeCycle, makeHooksLifeCycle, makeServerHooksLifeCycle} from "./hook.ts";
import {Request} from "./request.ts";
import {__exec__, Response} from "./response.ts";
import makeRoutesSystem, {RoutesObject} from "./route.ts";
import makeCheckerSystem, {Checkers} from "./checker.ts";
import correctPath from "./correctPath.ts";
import makeProcessSystem, {Processes} from "./process.ts";
import makeContentTypeParserSystem from "./contentTypeParser.ts";
import {AbstractRoutes} from "./abstractRoute.ts";

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

export type Plugins = Record<string, {version: string, data: any}>;
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
	buildContentTypeBody: ReturnType<typeof makeContentTypeParserSystem>["buildContentTypeBody"]
	declareAbstractRoute: ReturnType<typeof makeRoutesSystem>["declareAbstractRoute"];
	mergeAbstractRoute: ReturnType<typeof makeRoutesSystem>["mergeAbstractRoute"];
	use<
		duploInputFunction extends ((instance: DuploInstance<duploConfig>, options: any) => any)
	>(input: duploInputFunction, options?: Parameters<duploInputFunction>[1]): ReturnType<duploInputFunction>
	buildRouter: ReturnType<typeof makeRoutesSystem>["buildRouter"];
	routes: RoutesObject;
	checkers: Checkers;
	processes: Processes;
	abstractRoutes: AbstractRoutes;
	plugins: Plugins;
}

export default function Duplo<duploConfig extends DuploConfig>(config: duploConfig): DuploInstance<duploConfig>{
	config.prefix = correctPath(config.prefix || "");
	if(config.prefix === "/")config.prefix = "";

	const hooksLifeCyle = makeHooksLifeCycle();
	const serverHooksLifeCycle = makeServerHooksLifeCycle();

	const {addContentTypeParsers, buildContentTypeBody, parseContentTypeBody} = makeContentTypeParserSystem();
	const {createChecker, checkers} = makeCheckerSystem(serverHooksLifeCycle);
	const {createProcess, processes} = makeProcessSystem(serverHooksLifeCycle);
	const {
		declareRoute, 
		buildRouter, 
		findRoute, 
		setNotfoundHandler, 
		setErrorHandler, 
		declareAbstractRoute,
		mergeAbstractRoute,
		routes, 
		abstractRoutes
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
			buildRouter();
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
		buildContentTypeBody,
		declareAbstractRoute,
		mergeAbstractRoute,
		use: (input, options) => input(duploInstance, options),
		buildRouter,
		routes,
		checkers,
		processes,
		abstractRoutes,
		plugins: {}
	};

	return duploInstance; 
}
