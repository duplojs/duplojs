import {MergeAbstractRoute as DefaultMergeAbstractRoute} from "../../../../../scripts";
import {AbstractRouteInstance} from "./instance";
import {SubAbstractRoute} from "./sub";

export class MergeAbstractRoute extends DefaultMergeAbstractRoute{
	get SubAbstractRoute(){
		return SubAbstractRoute;
	}
	get AbstractRouteInstance(){
		return AbstractRouteInstance;
	}

	get config(){
		return {
			port: 1506, 
			host: "localhost", 
			environment: "DEV" as const
		};
	}
}
