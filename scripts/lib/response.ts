import {ServerResponse} from "http";
import {anotherbackConfig} from "./main";
import {CookieSerializeOptions} from "cookie";
import {createReadStream, existsSync,} from "fs";
import mime from "mime";
import {basename} from "path";

export const __exec__ = Symbol("exec");

export interface Response {
	readonly rawResponse: InstanceType<typeof ServerResponse>;
	code(status: number): Response;
	status: number;
	info(info: string): Response;
	send(data?: any): never | void;
	sendFile(path: string): never | void;
	download(path: string, name?: string): never | void;
	getHeaders(): Record<string, string>;
	getHeader(index: string): string;
	setHeaders(headers: Record<string, string>): Response;
	setHeader(index: string, value: string): Response;
	setCookie(name: string, value: string, params?: CookieSerializeOptions): Response;
	deleteCookie(name: string, params?: CookieSerializeOptions): Response;
	cookies: Record<string, {value: string, params: CookieSerializeOptions}>;
	data?: any;
	file?: string;
	isSend: boolean;
	[__exec__](): void;
	[Symbol.hasInstance](instance: any): boolean;
}

export class ResponseInstance{}

export default function makeResponse(response: Response["rawResponse"], config: anotherbackConfig): Response
{
	let _code: number = 200;
	let _info: string;
	let _headers: Record<string, string> = {};
	let _isSend = false;
	let _cookies: Record<string, {value: string, params: CookieSerializeOptions}> = {};
	return {
		rawResponse: response,
		code(status){
			_code = status;
			return this;
		},
		get status(){
			return _code;
		},
		info(info){
			_info = info;
			return this;
		},
		send(data){
			if(_isSend === true){
				console.error(new Error("A response has already been sent."));
				return;
			}
			_isSend = true;

			this.data = data;
			if(_info)_headers.info = _info;
			throw this;
		},
		sendFile(path){
			if(_isSend === true){
				console.error(new Error("A response has already been sent."));
				return;
			}
			_isSend = true;

			if(!existsSync(path)) this.code(404).info("FILE.NOTFOUND").send();
			this.file = path;
			if(_info)_headers.info = _info;
			_headers["content-type"] = mime.getType(path) || "text/plain";
			throw this;
		},
		download(path, name){
			if(_isSend === true){
				console.error(new Error("A response has already been sent."));
				return;
			}
			_isSend = true;

			if(!existsSync(path)) this.code(404).info("FILE.NOTFOUND").send();
			this.file = path;
			if(_info)_headers.info = _info;
			_headers["content-type"] = "application/octet-stream";
			_headers["Content-Disposition"] = "attachment; filename=" + (name || basename(path));
			throw this;
		},
		getHeaders(){
			return _headers;
		},
		getHeader(index){
			return _headers[index.toLowerCase()];
		},
		setHeaders(headers){
			_headers = {};
			Object.entries(headers).forEach(([index, value]) => _headers[index.toLowerCase()] = value);
			return this;
		},
		setHeader(index, value){
			_headers[index.toLowerCase()] = value;
			return this;
		},
		setCookie(name, value, params = {}){
			_cookies[name] = {value, params};
			return this;
		},
		deleteCookie(name, params = {path: "/"}){
			params.expires = new Date(0);
    		params.maxAge = undefined;
			_cookies[name] = {value: "", params};
			return this;
		},
		get cookies(){
			return _cookies;
		},
		data: undefined,
		file: undefined,
		get isSend(){
			return _isSend;
		},
		[__exec__](){
			try {
				response.writeHead(_code, _headers);
				if(this.data)response.write(this.data);
				else if(this.file){
					createReadStream(this.file).pipe(response);
					return;
				}
				response.end();
			} 
			catch (error){
				_isSend = false;
				throw error;
			}
			
		},
		[Symbol.hasInstance](instance){
			return instance?.name === "ResponseInstance";
		}
	};
}
