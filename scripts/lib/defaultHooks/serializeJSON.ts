import {Request} from "../request";
import {Response} from "../response";

export const serializeJSON = (request: Request, response: Response) => {
	if(
		typeof response.headers["content-type"] === "string" && 
		/application\/json/.test(response.headers["content-type"]) &&
		response.body &&
		typeof response.body === "object" && 
		response.body.constructor.name === "Object"
	){
		response.body = JSON.stringify(response.body);
		response.rawResponse.write(response.body);
		
		return true;
	}
}; 
