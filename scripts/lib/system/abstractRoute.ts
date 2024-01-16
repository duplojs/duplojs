import {ServerHooksLifeCycle} from "../hook";
import {Response} from "../response";
import {DuploConfig} from "../main";
import {ErrorExtractFunction} from "../duplose";
import {AbstractRoute as DefaultAbstractRoute} from "../duplose/abstractRoute";
import {makeAbstractRoutesBuilder} from "../builder/abstractRoute";
import {DeclareRoute} from "../builder/route";

export type AbstractRoutes = Record<string, DefaultAbstractRoute>;

export interface AbstractRouteEditableProperty{
	defaultErrorExtract: ErrorExtractFunction<Response>;
}

export function makeAbstractRouteSystem(
	config: DuploConfig,
	serverHooksLifeCycle: ServerHooksLifeCycle,
	declareRoute: DeclareRoute
){
	class AbstractRoute extends DefaultAbstractRoute<any, any>{
		public get config(){
			return config;
		}

		public get defaultErrorExtract(){
			return AbstractRoute.editableProperty.defaultErrorExtract;
		}

		public static editableProperty: AbstractRouteEditableProperty = {
			defaultErrorExtract: (response, type, index) => response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send(),
		};
	}

	const setDefaultErrorExtract = (errorExtract: ErrorExtractFunction<Response>) => {
		AbstractRoute.editableProperty.defaultErrorExtract = errorExtract;
	};

	const abstractRoutes: AbstractRoutes = {};

	const {declareAbstractRoute} = makeAbstractRoutesBuilder(serverHooksLifeCycle, declareRoute, AbstractRoute, abstractRoutes);

	return {
		declareAbstractRoute,
		setDefaultErrorExtract,
		AbstractRoute,
		abstractRoutes,
	};
}
