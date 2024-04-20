import {IncomingHttpHeaders, IncomingMessage} from "http";
import fastQueryString from "fast-querystring";

export type HttpMethods = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

/**
 * @deprecated The method should not be used
 */
export type methods = HttpMethods;

export abstract class Request{
	rawRequest: InstanceType<typeof IncomingMessage>;
	method: HttpMethods;
	headers: IncomingHttpHeaders;
	url: string;
	host: string;
	origin: string;
	path: string;
	params: Record<string, string>;
	query: Record<string, string | string[]>;
	matchedPath: string | null;
	body: unknown;

	constructor(
		request: InstanceType<typeof IncomingMessage>, 
		params: Record<string, string>, 
		matchedPath: string | null,
	){
		const [path, query] = (request.url ?? "").split("?");
		this.rawRequest = request;
		this.method = request.method as HttpMethods;
		this.headers = request.headers;
		this.url = request.url || "";
		this.host = request.headers.host || "";
		this.origin = request.headers.origin || "";
		this.path = path.endsWith("/") ? (path.slice(0, -1) || "/") : path;
		this.params = params;
		this.query = query ? fastQueryString.parse(query) : {};
		this.matchedPath = matchedPath;
	}
}

export class ExtendsRequest extends Request{}
