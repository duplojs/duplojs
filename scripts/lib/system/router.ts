import {ExtendsRoute, RouteFunction} from "../duplose/route";
import {mapped} from "../stringBuilder";
import {matchRoute, routerStringFunction} from "../stringBuilder/router";
import {DuploConfig} from "../main";
import {Request, methods} from "../request";
import {Response, __exec__} from "../response";
import {Routes} from "../system/route";
import {PromiseOrNot} from "../utility";
import {CutStep} from "../step/cut";

export type RouteFound = {
	routeFunction: RouteFunction,
	params: Record<string, string>,
	matchedPath: string | null
}

export type RouteFinder = (path: string) => RouteFound;

export type BuildedRouter = Record<
	string, 
	RouteFinder
>;

export type RouteNotfoundHandlerFunction = (request: Request, response: Response) => PromiseOrNot<void>;

export function makeRouterSystem(
	config: DuploConfig,
	Route: typeof ExtendsRoute,
	routes: Routes,
){
	const buildedRouter: BuildedRouter = {};

	const notfoundRoute = new Route("GET", ["*"], undefined);
	const cutStep = new CutStep(
		({}, response, request) => {
			response.code(404).info("NOTFOUND").send(`${request.method}:${request.path} not found`);
		}, 
		[]
	);
	notfoundRoute.addStepCut(cutStep, []);
	
	const setNotfoundHandler = (notfoundFunction: RouteNotfoundHandlerFunction) => {
		cutStep.short = async({}, response, request) => {
			await notfoundFunction(request, response);
		};
	};

	const findRoute = (method: methods, path: string) => {
		if(!buildedRouter[method]) return {
			routeFunction: notfoundRoute.routeFunction,
			params: {},
			matchedPath: null,
		};
		
		return buildedRouter[method](path);
	};

	const buildRouter = () => {
		notfoundRoute.build();

		Object.entries(routes).forEach(([method, routes]) => {
			const stringFunction = routerStringFunction(
				mapped(
					routes,
					({paths}, index) => 
						mapped(
							paths,
							(path) => 
								matchRoute(
									`/^${(config.prefix + path).replace(/\//g, "\\/").replace(/\.?\*/g, ".*")}\\/?(?:\\?[^]*)?$/`.replace(
										/\{([a-zA-Z0-9_\-]+)\}/g,
										(match, group1) => `(?<${group1}>[a-zA-Z0-9_\\-]+)`
									),
									index,
									path
								)
						)
				)
			);

			buildedRouter[method] = eval(stringFunction).bind({
				routes,
				notfoundHandlerFunction: notfoundRoute.routeFunction, 
			});
		});
	};

	return {
		setNotfoundHandler,
		buildRouter,
		findRoute,
		buildedRouter,
	};
}
