import http from "http";
import makeContentTypeParserSystem from "./contentTypeParser";
import {AddHooksLifeCycle, AddServerHooksLifeCycle, makeHooksLifeCycle, makeServerHooksLifeCycle} from "./hook";
import {makeAbstractRouteSystem} from "./system/abstractRoute";
import makeCheckerSystem, {Checkers} from "./system/checker";
import {makeProcessSystem} from "./system/process";
import {makeRouteSystem} from "./system/route";
import {makeRouterSystem} from "./system/router";
import {AnyFunction, buildAbstractRoutes, buildProcesses, buildRoutes, correctPath, deepFreeze, deleteDescriptions} from "./utile";
import {ExtendsRequest, Request, methods} from "./request";
import {ExtendsResponse, Response, SentError} from "./response";
import {ErrorExtractFunction} from "./duplose";

export interface DuploConfig{
	port: number,
	host: string,
	onLaunch?: () => void;
	onClose?: () => void;
	prefix?: string;
	keepDescriptions?: boolean;
	environment?: "DEV" | "PROD";
}

export interface Plugins {}

export class DuploInstance<duploConfig extends DuploConfig>{
	protected hooksLifeCyle = makeHooksLifeCycle();
	protected serverHooksLifeCycle = makeServerHooksLifeCycle();

	public server: http.Server;
	public Request: typeof ExtendsRequest;
	public Response: typeof ExtendsResponse;
	
	public addContentTypeParsers: ReturnType<typeof makeContentTypeParserSystem>["addContentTypeParsers"];
	protected buildContentTypeBody: ReturnType<typeof makeContentTypeParserSystem>["buildContentTypeBody"];
	protected contentTypeParsers: ReturnType<typeof makeContentTypeParserSystem>["contentTypeParsers"];
	protected parseContentTypeBody: ReturnType<typeof makeContentTypeParserSystem>["parseContentTypeBody"];

	protected Checker: ReturnType<typeof makeCheckerSystem>["Checker"];
	public createChecker: ReturnType<typeof makeCheckerSystem>["createChecker"];
	public checkers: ReturnType<typeof makeCheckerSystem>["checkers"];

	public createProcess: ReturnType<typeof makeProcessSystem>["createProcess"];
	protected processSetDefaultErrorExtract: ReturnType<typeof makeProcessSystem>["setDefaultErrorExtract"];
	public processes: ReturnType<typeof makeProcessSystem>["processes"];
	protected Process: ReturnType<typeof makeProcessSystem>["Process"];

	public declareRoute: ReturnType<typeof makeRouteSystem>["declareRoute"];
	public setErrorHandler: ReturnType<typeof makeRouteSystem>["setErrorHandler"];
	protected routeSetDefaultErrorExtract: ReturnType<typeof makeRouteSystem>["setDefaultErrorExtract"];
	public routes: ReturnType<typeof makeRouteSystem>["routes"];
	protected Route: ReturnType<typeof makeRouteSystem>["Route"];

	protected SubAbstractRoute: ReturnType<typeof makeAbstractRouteSystem>["SubAbstractRoute"];
	protected AbstractRouteInstance: ReturnType<typeof makeAbstractRouteSystem>["AbstractRouteInstance"];
	protected AbstractRoute: ReturnType<typeof makeAbstractRouteSystem>["AbstractRoute"];
	protected MergeAbstractRoute: ReturnType<typeof makeAbstractRouteSystem>["MergeAbstractRoute"];
	public declareAbstractRoute: ReturnType<typeof makeAbstractRouteSystem>["declareAbstractRoute"];
	public mergeAbstractRoute: ReturnType<typeof makeAbstractRouteSystem>["mergeAbstractRoute"];
	protected abstractRouteSetDefaultErrorExtract:  ReturnType<typeof makeAbstractRouteSystem>["setDefaultErrorExtract"];
	public abstractRoutes: ReturnType<typeof makeAbstractRouteSystem>["abstractRoutes"];

	protected findRoute: ReturnType<typeof makeRouterSystem>["findRoute"];
	protected buildRouter: ReturnType<typeof makeRouterSystem>["buildRouter"];
	protected buildedRouter: ReturnType<typeof makeRouterSystem>["buildedRouter"];
	public setNotfoundHandler: ReturnType<typeof makeRouterSystem>["setNotfoundHandler"];

	public setDefaultErrorExtract(errorExtract: ErrorExtractFunction<Response>){
		this.routeSetDefaultErrorExtract(errorExtract);
		this.processSetDefaultErrorExtract(errorExtract);
		this.abstractRouteSetDefaultErrorExtract(errorExtract);
	}
	
	public plugins: Plugins = {};
	public addHook: AddHooksLifeCycle<this>["addHook"] & AddServerHooksLifeCycle<this>["addHook"];

	constructor(
		public config: duploConfig
	){
		config.prefix = correctPath(config.prefix || "");

		this.Request = class extends Request{};
		this.Response = class extends Response{};

		const {
			addContentTypeParsers, 
			buildContentTypeBody, 
			parseContentTypeBody,
			contentTypeParsers
		} = makeContentTypeParserSystem();
		this.addContentTypeParsers = addContentTypeParsers;
		this.buildContentTypeBody = buildContentTypeBody;
		this.parseContentTypeBody = parseContentTypeBody;
		this.contentTypeParsers = contentTypeParsers;
		
		const {
			Checker,
			createChecker, 
			checkers
		} = makeCheckerSystem(this.serverHooksLifeCycle);
		this.Checker = Checker;
		this.createChecker = createChecker;
		this.checkers = checkers;
		
		const {
			createProcess, 
			setDefaultErrorExtract: processSetDefaultErrorExtract,
			processes,
			Process,
		} = makeProcessSystem(config, this.serverHooksLifeCycle);
		this.createProcess = createProcess;
		this.processSetDefaultErrorExtract = processSetDefaultErrorExtract;
		this.processes = processes;
		this.Process = Process;
		
		const {
			declareRoute, 
			setErrorHandler, 
			setDefaultErrorExtract: routeSetDefaultErrorExtract, 
			routes, 
			Route,
		} = makeRouteSystem(config, this.hooksLifeCyle, this.serverHooksLifeCycle, parseContentTypeBody);
		this.declareRoute = declareRoute;
		this.setErrorHandler = setErrorHandler;
		this.routeSetDefaultErrorExtract = routeSetDefaultErrorExtract;
		this.routes = routes;
		this.Route = Route;
		
		const {
			SubAbstractRoute,
			AbstractRouteInstance,
			AbstractRoute,
			MergeAbstractRoute,
			declareAbstractRoute,
			mergeAbstractRoute,
			setDefaultErrorExtract: abstractRouteSetDefaultErrorExtract,
			abstractRoutes,
		} = makeAbstractRouteSystem(config, this.serverHooksLifeCycle, declareRoute);
		this.SubAbstractRoute = SubAbstractRoute;
		this.AbstractRouteInstance = AbstractRouteInstance;
		this.AbstractRoute = AbstractRoute;
		this.MergeAbstractRoute = MergeAbstractRoute;
		this.declareAbstractRoute = declareAbstractRoute;
		this.mergeAbstractRoute = mergeAbstractRoute;
		this.abstractRouteSetDefaultErrorExtract = abstractRouteSetDefaultErrorExtract;
		this.abstractRoutes = abstractRoutes;
		
		const {
			findRoute, 
			buildRouter, 
			setNotfoundHandler, 
			buildedRouter,
		} = makeRouterSystem(config, Route, routes);
		this.findRoute = findRoute;
		this.buildRouter = buildRouter;
		this.buildedRouter = buildedRouter;
		this.setNotfoundHandler = setNotfoundHandler;

		this.addHook = (name, hookFunction) => {
			if(Object.hasProp(this.hooksLifeCyle, name)){
				this.hooksLifeCyle[name].addSubscriber(hookFunction as AnyFunction);
			}
			else if(Object.hasProp(this.serverHooksLifeCycle, name)){
				this.serverHooksLifeCycle[name].addSubscriber(hookFunction as AnyFunction);
			}
			return this;
		};

		this.server = http.createServer(this.serverHandler.bind(this));
	}

	private async serverHandler(serverRequest: http.IncomingMessage, serverResponse: http.ServerResponse){
		try {
			const {routeFunction, params, matchedPath} = this.findRoute(serverRequest.method as methods, serverRequest.url as string);

			await routeFunction(new this.Request(serverRequest, params, matchedPath), new this.Response(serverResponse));
		}
		catch (error){
			if(error instanceof Response) error = new SentError();
			if(error instanceof SentError) error = error.error;
			await this.serverHooksLifeCycle.onServerError.launchSubscriberAsync(serverRequest, serverResponse, error as Error);
			if(!serverResponse.headersSent){
				serverResponse.writeHead(500, {"content-type": "text/plain"});
				serverResponse.write(error?.toString?.() || "");
				serverResponse.end();
			}
		}
	}

	public launch(onLaunch = () => console.log("Ready !")){
		this.serverHooksLifeCycle.beforeBuildRouter.launchSubscriber();
		
		buildProcesses(this.processes);
		buildAbstractRoutes(this.abstractRoutes);
		buildRoutes(this.routes);
		
		if(this.config.keepDescriptions !== true){
			deleteDescriptions(this.routes, this.checkers, this.processes, this.abstractRoutes);
		}
		deepFreeze(this.routes, 3);
		deepFreeze(this.checkers);
		deepFreeze(this.processes, 2);
		deepFreeze(this.abstractRoutes, 2);
		
		this.buildRouter();
		this.buildContentTypeBody();

		this.serverHooksLifeCycle.onServerError.addSubscriber((serverRequest, serverResponse, error) => console.error(error));

		const onReady = this.serverHooksLifeCycle.onReady.build();
		this.server.on("listening", onReady);
		this.server.on("listening", onLaunch);
		if(this.config.onLaunch){
			this.server.on("listening", this.config.onLaunch);
		}

		const onClose = this.serverHooksLifeCycle.onClose.build();
		this.server.on("close", onClose);
		if(this.config.onClose){
			this.server.on("close", this.config.onClose);
		}

		this.server.listen(this.config.port, this.config.host);

		process.on("uncaughtException", (error: any, origin) => {
			if(error instanceof Response) error = new SentError();
			if(error instanceof SentError) console.error(error.error, origin);
			else {
				console.error(error, origin);
				process.exit(1);
			}
		});

		return this.server;
	}

	public use<
		duploInputFunction extends((instance: DuploInstance<duploConfig>, options: any) => any)
	>(input: duploInputFunction, options?: Parameters<duploInputFunction>[1]): ReturnType<duploInputFunction>
	{
		return input(this, options);
	}
}
