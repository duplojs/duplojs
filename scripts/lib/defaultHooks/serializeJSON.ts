import {Request} from "../request";
import {Response} from "../response";

export const serializeJSON = (request: Request, response: Response) => {
	if(
		response.body &&
		typeof response.body === "object"
	){
		response.body = JSON.stringify(response.body);
		response.rawResponse.write(response.body);
		
		return true;
	}
}; 
