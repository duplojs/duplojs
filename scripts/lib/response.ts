import {ServerResponse} from "http";
import {createReadStream, existsSync} from "fs";
import mime from "mime";
import {basename} from "path";

export const __exec__ = Symbol("exec");

export abstract class Response{
	constructor(response: InstanceType<typeof ServerResponse>){
		this.rawResponse = response;
	}

	rawResponse: InstanceType<typeof ServerResponse>;

	code(status: number){
		this.status = status;
		return this;
	}

	status = 200;

	info(info: string){
		this.information = info;
		return this;
	}

	information?: string;

	send(body?: unknown): never
	{
		if(this.isSend === true) throw new SentError();
		this.isSend = true;
		
		this.body = body;
		throw this;
	}

	sendFile(path: string): never
	{
		if(!existsSync(path)) this.code(404).info("FILE.NOTFOUND").send();

		if(this.isSend === true) throw new SentError();
		this.isSend = true;

		this.file = path;
		this.headers["content-type"] = mime.getType(path) || "text/plain; charset=utf-8";
		throw this;
	}

	download(path: string, name?: string): never
	{
		if(!existsSync(path)) this.code(404).info("FILE.NOTFOUND").send();

		if(this.isSend === true) throw new SentError();
		this.isSend = true;

		this.file = path;
		this.headers["content-type"] = "application/octet-stream";
		this.headers["Content-Disposition"] = "attachment; filename=" + (name || basename(path));
		throw this;
	}

	redirect(path: string, code: number = 302): never
	{
		if(this.isSend === true) throw new SentError();
		this.isSend = true;

		this.headers["Location"] = path;
		this.status = code;
		throw this;
	}

	setHeaders(headers: Record<string, string | string[]>){
		this.headers = {...this.headers, ...headers};
		return this;
	}

	setHeader(index: string, value: string | string[]){
		this.headers[index] = value;
		return this;
	}

	headers: Record<string, string | string[]> = {};

	body: unknown;

	file?: string;

	isSend = false;

	[__exec__](){
		// Dans le cas ou un plugin a besoin d'un systéme de réponse 
		// différent, il peut faire ça logique dans le hook "beforeSend"
		// et répondre manuelment avec l'objet ServerReponse (rawResponse).
		// Cette condition permet d'annuler la logique par défaut d'envois
		// dans le cas ou une réponse serveur a déjà étais envoyer.
		if(this.rawResponse.headersSent) return Promise.resolve();

		if(this.information) this.headers.info = this.information;
		if(this.body !== undefined){
			const contentType = this.headers["content-type"] as string;
			const hasContentType = contentType !== undefined;
			
			if(
				hasContentType === false && 
				(typeof this.body === "string" || typeof this.body === "number")
			){
				this.headers["content-type"] = "text/plain; charset=utf-8";
				this.body = this.body.toString();
			}
			else if(hasContentType === false && this.body instanceof ArrayBuffer){
				this.headers["content-type"] = "application/octet-stream";
			}
			else if(
				(hasContentType === false || /json/.test(contentType)) && 
				typeof this.body === "object"
			){
				if(hasContentType === false){
					this.headers["content-type"] = "application/json; charset=utf-8";
				}
				this.body = JSON.stringify(this.body);
			}

			this.rawResponse.writeHead(this.status, this.headers);
			return new Promise((resolve, reject) => {
				this.rawResponse
				.once("error", reject)
				.once("close", resolve)
				.write(this.body);
				
				this.rawResponse.end();
			});
		}
		else if(this.file){
			this.rawResponse.writeHead(this.status, this.headers);

			return new Promise((resolve, reject) => {
				createReadStream(this.file as string)
				.pipe(
					this.rawResponse
					.once("error", reject)
					.once("close", resolve)
				);
			});
		}
		else {
			this.rawResponse.writeHead(this.status, this.headers);
			return new Promise((resolve, reject) => {
				this.rawResponse
				.once("error", reject)
				.once("close", resolve)
				.end();
			});
		}
	}
}

export class ExtendsResponse extends Response{}

export class SentError{
	constructor(message = "There was a problem related to a response made outside the recommended context"){
		this.error = new Error(message);
	}

	error: Error;
}
