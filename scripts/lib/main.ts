import http from "http";
import {AddHooksLifeCycle, AddServerHooksLifeCycle, makeHooksLifeCycle, makeServerHooksLifeCycle} from "./hook.ts";
import {Request, methods} from "./request.ts";
import {__exec__, Response, SentError} from "./response.ts";
import makeCheckerSystem, {Checkers} from "./system/checker.ts";
import correctPath from "./correctPath.ts";
import {makeProcessSystem, Processes} from "./system/process.ts";
import makeContentTypeParserSystem from "./contentTypeParser.ts";
import {deepFreeze, deleteDescriptions, rebuildAbstractRoutes, rebuildProcesses, rebuildRoutes} from "./utility.ts";
import {makeRouterSystem} from "./system/router.ts";
import {Routes, makeRouteSystem} from "./system/route.ts";
import {AbstractRoutes, makeAbstractRouteSystem} from "./system/abstractRoute.ts";
import {ExtractObject} from "./duplose/index.ts";
import {BuilderPatternRoute} from "./builder/route.ts";
import {BuilderPatternAbstractRoute, DeclareAbstractRoute} from "./builder/abstractRoute.ts";

export interface DuploConfig{
	port: number,
	host: string,
	onLaunch?: () => void;
	onClose?: () => void;
	prefix?: string;
	keepDescriptions?: boolean;
	environment?: "DEV" | "PROD";
	rebuildRoutes?: boolean;
	rebuildAbstractRoutes?: boolean;
	rebuildProcess?: boolean;
}

export interface Plugins {}

export interface DuploInstance<duploConfig extends DuploConfig> {
	Request: typeof Request;
	Response: typeof Response;
	server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
	config: duploConfig;
	launch(onReady?: () => void): DuploInstance<duploConfig>["server"];
	addHook: AddHooksLifeCycle<DuploInstance<duploConfig>>["addHook"] & AddServerHooksLifeCycle<DuploInstance<duploConfig>>["addHook"];
	declareRoute: ReturnType<typeof makeRouteSystem>["declareRoute"];
	createChecker: ReturnType<typeof makeCheckerSystem>["createChecker"];
	setNotfoundHandler: ReturnType<typeof makeRouterSystem>["setNotfoundHandler"];
	setErrorHandler: ReturnType<typeof makeRouteSystem>["setErrorHandler"];
	createProcess: ReturnType<typeof makeProcessSystem>["createProcess"];
	addContentTypeParsers: ReturnType<typeof makeContentTypeParserSystem>["addContentTypeParsers"];
	declareAbstractRoute: DeclareAbstractRoute;
	mergeAbstractRoute: ReturnType<typeof makeRoutesSystem>["mergeAbstractRoute"];
	setDefaultErrorExtract: ReturnType<typeof makeRouteSystem>["setDefaultErrorExtract"];
	use<
		duploInputFunction extends ((instance: DuploInstance<duploConfig>, options: any) => any)
	>(input: duploInputFunction, options?: Parameters<duploInputFunction>[1]): ReturnType<duploInputFunction>
	routes: Routes;
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

	const {
		addContentTypeParsers, 
		buildContentTypeBody, 
		parseContentTypeBody
	} = makeContentTypeParserSystem();
	const {
		createChecker, 
		checkers
	} = makeCheckerSystem(serverHooksLifeCycle);
	const {
		createProcess, 
		setDefaultErrorExtract: processSetDefaultErrorExtract,
		processes,
		Process,
	} = makeProcessSystem(config, serverHooksLifeCycle);
	const {
		declareRoute, 
		setErrorHandler, 
		setDefaultErrorExtract: routeSetDefaultErrorExtract, 
		routes, 
		Route,
	} = makeRouteSystem(config, hooksLifeCyle, serverHooksLifeCycle, parseContentTypeBody);
	const {
		declareAbstractRoute,
		setDefaultErrorExtract: abstractRouteSetDefaultErrorExtract,
		AbstractRoute,
		abstractRoutes,
	} = makeAbstractRouteSystem(config, serverHooksLifeCycle, declareRoute);
	const {
		findRoute, 
		buildRouter, 
		setNotfoundHandler, 
		buildedRouter,
	} = makeRouterSystem(config, Route, routes);

	const server = http.createServer( 
		async(serverRequest, serverResponse) => {
			try {
				const {routeFunction, params, matchedPath} = findRoute(serverRequest.method as methods, serverRequest.url as string);

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
			
			if(config.rebuildProcess === true) rebuildProcesses(processes);
			if(config.rebuildAbstractRoutes === true) rebuildAbstractRoutes(abstractRoutes);
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
		declareRoute<
			request extends Request = Request, 
			response extends Response = Response,
			extractObj extends ExtractObject = ExtractObject,
		>(method: methods, path: string | string[], ...desc: any[]){
			return declareRoute(method, path, undefined, ...desc) as BuilderPatternRoute<request, response, extractObj>;
		},
		declareAbstractRoute<
			request extends Request = Request, 
			response extends Response = Response,
			extractObj extends ExtractObject = ExtractObject
		>(name: string, ...desc: any[]){
			return declareAbstractRoute(name, undefined, ...desc) as BuilderPatternAbstractRoute<request, response, extractObj>;
		},
		createChecker,
		createProcess,
		setNotfoundHandler,
		setErrorHandler,
		addContentTypeParsers,
		// mergeAbstractRoute,
		setDefaultErrorExtract: (errorExtract) => {
			processSetDefaultErrorExtract(errorExtract);
			routeSetDefaultErrorExtract(errorExtract);
			abstractRouteSetDefaultErrorExtract(errorExtract);
		},
		use: (input, options) => input(duploInstance, options),
		routes,
		checkers,
		processes,
		abstractRoutes,
		plugins: {}
	};

	return duploInstance; 
}
