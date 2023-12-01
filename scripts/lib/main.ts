import http from "http";
import {AddHooksLifeCycle, AddServerHooksLifeCycle, makeHooksLifeCycle, makeServerHooksLifeCycle} from "./hook.ts";
import {Request} from "./request.ts";
import {__exec__, Response, SentError} from "./response.ts";
import makeRoutesSystem, {RoutesObject} from "./route.ts";
import makeCheckerSystem, {Checkers} from "./checker.ts";
import correctPath from "./correctPath.ts";
import makeProcessSystem, {Processes} from "./process.ts";
import makeContentTypeParserSystem from "./contentTypeParser.ts";
import {AbstractRoutes} from "./abstractRoute.ts";
import {deepFreeze, deleteDescriptions, rebuildRoutes} from "./utility.ts";

export interface DuploConfig{
	port: number,
	host: string,
	onLaunch?: () => void;
	onClose?: () => void;
	prefix?: string;
	keepDescriptions?: boolean;
	environment?: "DEV" | "PROD";
	rebuildRoutes?: boolean;
}

export interface Plugins {}

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
	setDefaultErrorExtract: ReturnType<typeof makeRoutesSystem>["setDefaultErrorExtract"];
	use<
		duploInputFunction extends ((instance: DuploInstance<duploConfig>, options: any) => any)
	>(input: duploInputFunction, options?: Parameters<duploInputFunction>[1]): ReturnType<duploInputFunction>
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
		setDefaultErrorExtract,
		routes, 
		abstractRoutes
	} = makeRoutesSystem(config, hooksLifeCyle, serverHooksLifeCycle, parseContentTypeBody);

	const server = http.createServer( 
		async(serverRequest, serverResponse) => {
			try {
				const {routeFunction, params, matchedPath} = findRoute(serverRequest.method as Request["method"], serverRequest.url as string);

				await routeFunction(new Request(serverRequest, params, matchedPath), new Response(serverResponse));
			}
			catch (error){
				if(error instanceof Response) error = new SentError();
				if(error instanceof SentError) error = error.error;
				await serverHooksLifeCycle.onServerError.launchSubscriber(serverRequest, serverResponse, error as Error);
				if(!serverResponse.headersSent){
					serverResponse.writeHead(500, {"content-type": "text/plain"});
					serverResponse.write(error?.toString?.() || "");
					serverResponse.end();
				}
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
			serverHooksLifeCycle.beforeBuildRouter.syncLaunchSubscriber();
			
			if(config.rebuildRoutes === true) rebuildRoutes(routes);
			if(config.keepDescriptions !== true) deleteDescriptions(routes,	checkers, processes, abstractRoutes);
			deepFreeze(routes, 3);
			deepFreeze(checkers);
			deepFreeze(processes, 2);
			deepFreeze(abstractRoutes, 2);
			
			buildRouter();
			buildContentTypeBody();

			serverHooksLifeCycle.onServerError.addSubscriber((serverRequest, serverResponse, error) => console.error(error));

			const onReady = serverHooksLifeCycle.onReady.build();
			server.on("listening", onReady);
			server.on("listening", onLaunch);
			if(config.onLaunch)server.on("listening", config.onLaunch);

			const onClose = serverHooksLifeCycle.onClose.build();
			server.on("close", onClose);
			if(config.onClose)server.on("close", config.onClose);

			server.listen(config.port, config.host);

			process.on("uncaughtException", (error: any, origin) => {
				if(error instanceof Response) error = new SentError();
				if(error instanceof SentError) console.error(error.error, origin);
				else {
					console.error(error, origin);
					process.exit(1);
				}
			});

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
		setDefaultErrorExtract,
		use: (input, options) => input(duploInstance, options),
		routes,
		checkers,
		processes,
		abstractRoutes,
		plugins: {}
	};

	return duploInstance; 
}
