import {defaultErrorExtract} from ".";
import {Process as DefaultProcess} from "../../../../scripts";

export class Process extends DefaultProcess{
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
}
