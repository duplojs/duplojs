import {Duplose as DefaultDuplose} from "../../../../scripts/lib/duplose";

export function defaultErrorExtract(){}

export class Duplose extends DefaultDuplose<any, any>{
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

	build(){
		
	}
}
