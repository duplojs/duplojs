import {ServerResponse} from "http";
import {createReadStream, existsSync,} from "fs";
import mime from "mime";
import {basename} from "path";

export const __exec__ = Symbol("exec");

export class Response{
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
		this.headers["content-type"] = mime.getType(path) || "text/plain; charset=utf-8";
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
		this.headers["content-type"] = "application/octet-stream";
		this.headers["Content-Disposition"] = "attachment; filename=" + (name || basename(path));
		throw this;
	}

	redirect(path: string){
		if(this.isSend === true){
			console.error(new Error("A response has already been sent."));
			return;
		}
		this.isSend = true;

		this.headers["Location"] = path;
		this.status = this.status === 200 ? 302 : this.status;
		throw this;
	}

	setHeaders(headers: Record<string, string>){
		this.headers = {...this.headers, ...headers};
		return this;
	}

	setHeader(index: string, value: string){
		this.headers[index.toLowerCase()] = value;
		return this;
	}

	headers: Record<string, string> = {};

	data: unknown;

	#file?: string;

	isSend = false;

	[__exec__](){
		if(this.information) this.headers.info = this.information;
		if(this.data !== undefined){
			const contentType = this.headers["content-type"];
			const hasContentType = contentType !== undefined;
			
			if(hasContentType === false && (typeof this.data === "string" || typeof this.data === "number")){
				this.headers["content-type"] = "text/plain; charset=utf-8";
				this.data = this.data.toString();
			}
			else if(hasContentType === false && this.data instanceof ArrayBuffer) this.headers["content-type"] = "application/octet-stream";
			else if((hasContentType === false || /json/.test(contentType)) && typeof this.data === "object"){
				if(hasContentType === false) this.headers["content-type"] = "application/json; charset=utf-8";
				this.data = JSON.stringify(this.data);
			}
			this.rawResponse.writeHead(this.status, this.headers);
			this.rawResponse.write(this.data);
			this.rawResponse.end();
		}
		else if(this.#file){
			this.rawResponse.writeHead(this.status, this.headers);
			createReadStream(this.#file).pipe(this.rawResponse);
		}
		else {
			this.rawResponse.writeHead(this.status, this.headers);
			this.rawResponse.end();
		}
	}
}
