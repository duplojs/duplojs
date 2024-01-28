import {ServerResponse} from "http";
import {existsSync} from "fs";
import mime from "mime";
import {basename} from "path";
import {AlreadySent} from "./error/alreadySent";

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
		this.setHeader("info", info);
		return this;
	}

	information?: string;

	send(body?: unknown): never
	{
		if(this.isSend === true) throw new AlreadySent();
		this.isSend = true;
		
		if(this.headers["content-type"] === undefined){
			if(typeof body === "string" || typeof body === "number" || body === null){
				this.headers["content-type"] = "text/plain; charset=utf-8";
			}
			else if(typeof body === "object" && body.constructor.name === "Object"){
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
}

export class ExtendsResponse extends Response{}
