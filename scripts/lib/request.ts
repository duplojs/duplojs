import {IncomingMessage} from "http";
import {DuploConfig} from "./main";
import fastQueryString from "fast-querystring";

export class Request{
	constructor(request: InstanceType<typeof IncomingMessage>, config: DuploConfig){
		const [path, query] = (request.url ?? "").split("?");
		this.rawRequest = request;
		this.path = path.endsWith("/") ? (path.slice(0, -1) || "/") : path;
		this.params = request.params;
		this.query = query ? fastQueryString.parse(query) : {};
	}

	rawRequest: InstanceType<typeof IncomingMessage>;

	get method(){
		return this.rawRequest.method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
	}

	get headers(){
		return this.rawRequest.headers;
	}

	get url(){
		return this.rawRequest.url || "";
	}

	get host(){
		return this.rawRequest.headers.host || "";
	}

	get origin(){
		return this.rawRequest.headers.origin || "";
	}

	path: string;

	query: Record<string, string>;

	params: Record<string, string>;

	body: unknown;
}
