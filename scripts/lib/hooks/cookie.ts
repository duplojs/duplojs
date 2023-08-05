import cookie from "cookie";
import Request from "../request";
import Response from "../response";

// export function parsCookies(request: Request, response: Response){
// 	if(request.rawRequest.headers?.cookie){
// 		request.cookies = cookie.parse(request.rawRequest.headers?.cookie || "");
// 	}
// }

// export function serializeCookies(request: Request, response: Response){
// 	if(response.cookies && Object.keys(response.cookies)[0] !== undefined){
// 		const setCookies: string[] = [];
// 		Object.entries(response.cookies).forEach(([index, obj]) => setCookies.push(cookie.serialize(index, obj.value, obj.params)));
// 		response.rawResponse.setHeader("set-cookie", setCookies.join(", "));
// 	}
// }
