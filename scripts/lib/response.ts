import {ServerResponse} from "http";
import {existsSync} from "fs";
import mime from "mime";
import {basename} from "path";
import {AlreadySent} from "./error/alreadySent";

export abstract class Response{
	rawResponse: InstanceType<typeof ServerResponse>;
	status = 200;
	information?: string;
	headers: Record<string, string | string[]> = {};
	file?: string;
	body: unknown;
	isSend = false;
	keepAlive = false;

	constructor(response: InstanceType<typeof ServerResponse>){
		this.rawResponse = response;
	}


	code(status: number){
		this.status = status;
		return this;
	}


	info(info?: string){
		if(info !== undefined){
			this.information = info;
			this.setHeader("info", info);
		}
		return this;
	}


	send(body?: unknown): never
	{
		if(this.isSend === true) throw new AlreadySent();
		this.isSend = true;
		
		if(this.headers["content-type"] === undefined){
			if(typeof body === "string" || typeof body === "number" || body === null){
				this.headers["content-type"] = "text/plain; charset=utf-8";
			}
			else if(typeof body === "object"){
				this.headers["content-type"] = "application/json; charset=utf-8";
			}
		}
		
		this.body = body;
		throw this;
	}

	sendFile(path: string): never
	{
		if(!existsSync(path)) this.code(404).info("FILE.NOTFOUND").send();

		if(this.isSend === true) throw new AlreadySent();
		this.isSend = true;

		this.file = path;
		this.headers["content-type"] = mime.getType(path) || "text/plain; charset=utf-8";
		throw this;
	}

	download(path: string, name?: string): never
	{
		if(!existsSync(path)) this.code(404).info("FILE.NOTFOUND").send();

		if(this.isSend === true) throw new AlreadySent();
		this.isSend = true;

		this.file = path;
		this.headers["content-type"] = "application/octet-stream";
		this.headers["Content-Disposition"] = "attachment; filename=" + (name || basename(path));
		throw this;
	}

	redirect(path: string, code: number = 302): never
	{
		if(this.isSend === true) throw new AlreadySent();
		this.isSend = true;

		this.headers["Location"] = path;
		this.status = code;
		throw this;
	}

	setHeaders(headers: Record<string, undefined | string | string[]>){
		Object.entries(headers).forEach(([key, value]) => {
			if(value !== undefined){
				this.headers[key] = value;
			}
		});
		return this;
	}

	setHeader(key: string, value?: string | string[]){
		if(value !== undefined){
			this.headers[key] = value;
		}
		return this;
	}
}

export class ExtendsResponse extends Response{}
