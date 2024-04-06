import {ServerHooksLifeCycle} from "../hook";
import {Response} from "../response";
import {ErrorExtractFunction} from "../duplose";
import {AbstractRoute as DefaultAbstractRoute} from "../duplose/abstractRoute";
import {makeAbstractRouteBuilder} from "../builder/abstractRoute";
import {DeclareRoute} from "../builder/route";
import {MergeAbstractRoute} from "../duplose/abstractRoute/merge";
import {SubAbstractRoute as DefaultSubAbstractRoute} from "../duplose/abstractRoute/sub";
import {MergeAbstractRoute as DefaultMergeAbstractRoute} from "../duplose/abstractRoute/merge";
import makeMergeAbstractRouteBuilder from "../builder/mergeAbstractRoute";
import {AbstractRouteInstance as DefaultAbstractRouteInstance} from "../duplose/abstractRoute/instance";
import {HttpMethods} from "../request";
import {DuploConfig} from "../duploInstance";

export type AbstractRoutes = (DefaultAbstractRoute | MergeAbstractRoute)[];

export interface AbstractRouteEditableProperty{
	defaultErrorExtract: ErrorExtractFunction<Response>;
}

export function makeAbstractRouteSystem(
	config: DuploConfig,
	serverHooksLifeCycle: ServerHooksLifeCycle,
	declareRoute: DeclareRoute
){
	class SubAbstractRoute extends DefaultSubAbstractRoute{}

	class AbstractRouteInstance extends DefaultAbstractRouteInstance{
		declareRoute(method: HttpMethods, paths: string | string[], ...desc: any[]){
			return declareRoute(method, paths, this.subAbstractRoute, desc) as any;
		}
		
		declareAbstractRoute(name: string, ...desc: any[]){
			return declareAbstractRoute(name, this.subAbstractRoute, desc) as any;
		}
	}
	
	class AbstractRoute extends DefaultAbstractRoute<any, any>{
		public get config(){
			return config;
		}

		public get defaultErrorExtract(){
			return AbstractRoute.editableProperty.defaultErrorExtract;
		}

		public get SubAbstractRoute(){
			return SubAbstractRoute;
		}

		public get AbstractRouteInstance(){
			return AbstractRouteInstance;
		}

		public static editableProperty: AbstractRouteEditableProperty = {
			defaultErrorExtract: (response, type, index) => response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send(),
		};
	}

	class MergeAbstractRoute extends DefaultMergeAbstractRoute{
		public get config(){
			return config;
		}

		public get SubAbstractRoute(){
			return SubAbstractRoute;
		}

		public get AbstractRouteInstance(){
			return AbstractRouteInstance;
		}
	}

	const abstractRoutes: AbstractRoutes = [];

	const {declareAbstractRoute} = makeAbstractRouteBuilder(serverHooksLifeCycle, AbstractRoute, abstractRoutes);

	const {mergeAbstractRoute} = makeMergeAbstractRouteBuilder(serverHooksLifeCycle, MergeAbstractRoute, abstractRoutes);

	const setDefaultErrorExtract = (errorExtract: ErrorExtractFunction<Response>) => {
		AbstractRoute.editableProperty.defaultErrorExtract = errorExtract;
	};

	return {
		SubAbstractRoute,
		AbstractRouteInstance,
		AbstractRoute,
		MergeAbstractRoute,
		declareAbstractRoute,
		mergeAbstractRoute,
		setDefaultErrorExtract,
		abstractRoutes,
	};
}
