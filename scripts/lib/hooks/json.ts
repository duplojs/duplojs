import {Request} from "../request";
import {Response} from "../response";

export async function bodyToJson(request: Request, response: Response){
	if((request.getHeader("content-type") || "").indexOf("application/json") !== -1){
		request.body = await new Promise((resolve, reject) => {
			let stringBody = "";
			request.rawRequest.on("error", reject);
			request.rawRequest.on("data", chunck => stringBody += chunck);
			request.rawRequest.on("end", () => resolve(JSON.parse(stringBody)));
		});
	}
}

export function objectToString(request: Request, response: Response){
	if(typeof response.data === "object" && !response.getHeader("content-type")){
		try {
			response.data = JSON.stringify(response.data);
			response.setHeader("content-type", "application/json;charset=utf-8");
		} 
		catch {}		
	}
}
