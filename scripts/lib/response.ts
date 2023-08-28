import {ServerResponse} from "http";
import {DuploConfig} from "./main";
import {createReadStream, existsSync,} from "fs";
import mime from "mime";
import {basename} from "path";

export const __exec__ = Symbol("exec");

export class Response{
	constructor(response: InstanceType<typeof ServerResponse>, config: DuploConfig){
		this.rawResponse = response;
	}

	rawResponse: InstanceType<typeof ServerResponse>;

	code(status: number){
		this.#status = status;
		return this;
	}

	#status = 200;

	info(info: string){
		this.#info = info;
		return this;
	}

	#info?: string;

	send(data?: any){
		if(this.isSend === true){
			console.error(new Error("A response has already been sent."));
			return;
		}

		this.isSend = true;
		this.data = data;
		throw this;
	}

	sendFile(path: string){
		if(this.isSend === true){
			console.error(new Error("A response has already been sent."));
			return;
		}
		this.isSend = true;

		if(!existsSync(path)) this.code(404).info("FILE.NOTFOUND").send();
		this.#file = path;
		this.#headers["content-type"] = mime.getType(path) || "text/plain; charset=utf-8";
		throw this;
	}

	download(path: string, name?: string){
		if(this.isSend === true){
			console.error(new Error("A response has already been sent."));
			return;
		}
		this.isSend = true;

		if(!existsSync(path)) this.code(404).info("FILE.NOTFOUND").send();
		this.#file = path;
		this.#headers["content-type"] = "application/octet-stream";
		this.#headers["Content-Disposition"] = "attachment; filename=" + (name || basename(path));
		throw this;
	}

	getHeaders(){
		return this.#headers;
	}

	getHeader(index: string){
		return this.#headers[index.toLowerCase()];
	}

	setHeaders(headers: Record<string, string>){
		this.#headers = {};
		Object.entries(headers).forEach(([index, value]) => this.#headers[index.toLowerCase()] = value);
		return this;
	}

	setHeader(index: string, value: string){
		this.#headers[index.toLowerCase()] = value;
		return this;
	}

	#headers: Record<string, string> = {};

	data: unknown;

	#file?: string;

	isSend = false;

	[__exec__](){
		if(this.#info) this.#headers.info = this.#info;
		if(this.data !== undefined){
			const contentType = this.getHeader("content-type");
			const hasContentType = contentType !== undefined;
			
			if(hasContentType === false && typeof this.data === "string") this.setHeader("content-type", "text/plain; charset=utf-8");
			else if(hasContentType === false && this.data instanceof ArrayBuffer) this.setHeader("content-type", "application/octet-stream");
			else if((hasContentType === false || /json/.test(contentType)) && typeof this.data === "object"){
				if(hasContentType === false) this.setHeader("content-type", "application/json; charset=utf-8");
				this.data = JSON.stringify(this.data);
			}
			this.rawResponse.writeHead(this.#status, this.#headers);
			this.rawResponse.write(this.data);
			this.rawResponse.end();
		}
		else if(this.#file){
			this.rawResponse.writeHead(this.#status, this.#headers);
			createReadStream(this.#file).pipe(this.rawResponse);
		}
		else {
			this.rawResponse.writeHead(this.#status, this.#headers);
			this.rawResponse.end();
		}
	}
}
