import makeContentTypeParserSystem from "../contentTypeParser";
import {HooksLifeCycle, ServerHooksLifeCycle} from "../hook";
import {Route as DefaultRoute, RouteErrorHandlerFunction} from "../duplose/route";
import {methods} from "../request";
import {makeRouteBuilder} from "../builder/route";
import {Response} from "../response";
import {ErrorExtractFunction} from "../duplose";
import {DuploConfig} from "../duploInstance";

export type Routes = Record<methods, DefaultRoute[]>;

export interface RouteEditableProperty{
	errorHandlerFunction: RouteErrorHandlerFunction,
	defaultErrorExtract: ErrorExtractFunction<Response>,
}

export function makeRouteSystem(
	config: DuploConfig, 
	mainHooksLifeCyle: HooksLifeCycle, 
	serverHooksLifeCycle: ServerHooksLifeCycle,
	parseContentTypeBody: ReturnType<typeof makeContentTypeParserSystem>["parseContentTypeBody"]
){
	class Route extends DefaultRoute{
		public get config(){
			return config;
		}

		public get parseContentTypeBody(){
			return parseContentTypeBody;
		}

		public get mainHooksLifeCyle(){
			return mainHooksLifeCyle;
		}

		public get errorHandlerFunction(){
			return Route.editableProperty.errorHandlerFunction;
		}

		public get defaultErrorExtract(){
			return Route.editableProperty.defaultErrorExtract;
		}

		public static editableProperty: RouteEditableProperty = {
			errorHandlerFunction: (request, response, error) => response.code(500).info("INTERNAL_SERVER_ERROR").send(error.stack),
			defaultErrorExtract: (response, type, index) => response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send(),
		};
	}

	const setErrorHandler = (errorFunction: RouteErrorHandlerFunction) => {
		Route.editableProperty.errorHandlerFunction = errorFunction;
	};
	const setDefaultErrorExtract = (errorExtract: ErrorExtractFunction<Response>) => {
		Route.editableProperty.defaultErrorExtract = errorExtract;
	};

	const routes: Routes = {
		GET: [],
		POST: [],
		PUT: [], 
		PATCH: [],
		DELETE: [], 
		OPTIONS: [], 
		HEAD: [], 
	};

	const {declareRoute} = makeRouteBuilder(serverHooksLifeCycle, Route, routes);
	
	return {
		declareRoute,
		setErrorHandler,
		setDefaultErrorExtract,
		routes,
		Route,
	};
}
