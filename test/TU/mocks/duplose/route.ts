import {defaultErrorExtract} from ".";
import {Route as DefaultRoute, RouteErrorHandlerFunction} from "../../../../scripts";
import {makeHooksLifeCycle} from "../../../../scripts/lib/hook";

export function errorHandlerFunction(){}

const mainHooksLifeCyle = makeHooksLifeCycle();

export class Route extends DefaultRoute{
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
	
	get errorHandlerFunction(){
		return errorHandlerFunction;
	}

	get mainHooksLifeCyle(){
		return mainHooksLifeCyle;
	}
}
