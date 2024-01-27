import {defaultErrorExtract} from "..";
import {AbstractRoute as DefaultAbstractRoute, ExtendsAbstractRouteInstance} from "../../../../../scripts";
import {AbstractRouteInstance} from "./instance";
import {SubAbstractRoute} from "./sub";

export class AbstractRoute extends DefaultAbstractRoute{
	get config(){
		return {
			port: 1506, 
			host: "localhost", 
			environment: "DEV" as const
		};
	}

	get defaultErrorExtract(){
		return defaultErrorExtract;
	}

	get SubAbstractRoute(){
		return SubAbstractRoute;
	}

	get AbstractRouteInstance(){
		return AbstractRouteInstance; 
	}
}
