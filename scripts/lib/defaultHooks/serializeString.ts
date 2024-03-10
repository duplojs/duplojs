import {Request} from "../request";
import {Response} from "../response";

export const serializeString = (request: Request, response: Response) => {
	if(
		typeof response.body === "string" ||
		typeof response.body === "number" ||
		response.body === null
	){
		response.body = response.body === null ? "null" : response.body.toString();
		response.rawResponse.write(response.body);
		
		return true;
	}
}; 
