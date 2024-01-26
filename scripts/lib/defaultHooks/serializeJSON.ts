import {Request} from "../request";
import {Response} from "../response";

export const serializeJSON = async(request: Request, response: Response) => {
	if(
		typeof response.headers["content-type"] === "string" && 
		/application\/json/.test(response.headers["content-type"]) &&
		response.body &&
		typeof response.body === "object" && 
		response.body.constructor.name === "Object"
	){
		response.body = JSON.stringify(response.body);
		await new Promise<void>((resolve, reject) => {
			response.rawResponse
			.once("error", reject)
			.write(response.body, () => {
				response.rawResponse.removeListener("error", reject);
				resolve();
			});
		});
		
		return true;
	}
}; 
