import Request from "../request";
import Response from "../response";

export function ErrorToText(request: Request, response: Response){
	if(response?.data instanceof Error){
		response.data = {
			name: response.data.name,
			message: response.data.message,
			stack: response.data.stack,
			cause: response.data.cause,
		};
	}
}
