import {Request} from "../request";

export const parsingBody = async(request: Request) => {
	const contentType = request.headers["content-type"];
	if(
		contentType && (
			/application\/json/.test(contentType) ||
			/text\/plain/.test(contentType)
		)
	){
		await new Promise<void>(
			(resolve, reject) => {
				let stringBody = "";
				request.rawRequest.once("error", reject);
				request.rawRequest.on("data", chunck => stringBody += chunck);
				request.rawRequest.on("end", () => {
					if(/text\/plain/.test(contentType)){
						request.body = stringBody;
					}
					else {
						request.body = JSON.parse(stringBody);
					}
					request.rawRequest.removeListener("error", reject);
					resolve();
				});
			}
		);
					
		return true;
	}
}; 
