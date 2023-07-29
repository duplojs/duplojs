import {Request} from "../request";
import {Response} from "../response";

export async function bodyToText(request: Request, response: Response){
	if((request.getHeader("content-type") || "").indexOf("text/plain") !== -1){
		request.body = await new Promise((resolve, reject) => {
			let stringBody = "";
			request.rawRequest.on("error", reject);
			request.rawRequest.on("data", chunck => stringBody += chunck);
			request.rawRequest.on("end", () => resolve(stringBody));
		});
	}
}

export async function textContentType(request: Request, response: Response){
	if(typeof response.data === "string" && !response.getHeader("content-type")){
		response.setHeader("content-type", "text/plain;charset=utf-8");	
	}
}
