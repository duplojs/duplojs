import {Request} from "../request";
import {Response} from "../response";

export const serializeString = async(request: Request, response: Response) => {
	if(
		typeof response.headers["content-type"] === "string" && 
		/text\/plain/.test(response.headers["content-type"]) &&
		(
			typeof response.body === "string" ||
			typeof response.body === "number" ||
			response.body === null
		)
	){
		response.body = response.body === null ? "null" : response.body.toString();
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
