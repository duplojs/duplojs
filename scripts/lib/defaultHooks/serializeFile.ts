import {createReadStream} from "fs";
import {Request} from "../request";
import {Response} from "../response";

export const serializeFile = async(request: Request, response: Response) => {
	if(response.file){
		await new Promise<void>((resolve, reject) => {
			createReadStream(response.file as string)
			.pipe(
				response.rawResponse
				.once("error", reject)
				.once("close", () => {
					response.rawResponse.removeListener("error", reject);
					resolve();
				})
			);
		});
		
		return true;
	}
}; 
