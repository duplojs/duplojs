import {IncomingHttpHeaders, IncomingMessage} from "http";
import fastQueryString from "fast-querystring";

export class Request{
	constructor(
		request: InstanceType<typeof IncomingMessage>, 
		params: Record<string, string>, 
		matchedPath: string | null,
	){
		const [path, query] = (request.url ?? "").split("?");
		this.rawRequest = request;
		this.method = request.method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
		this.headers = request.headers;
		this.url = request.url || "";
		this.host = request.headers.host || "";
		this.origin = request.headers.origin || "";
		this.path = path.endsWith("/") ? (path.slice(0, -1) || "/") : path;
		this.params = params;
		this.query = query ? fastQueryString.parse(query) : {};
		this.matchedPath = matchedPath;
	}

	rawRequest: InstanceType<typeof IncomingMessage>;

	method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

	headers: IncomingHttpHeaders;

	url: string;

	host: string;

	origin: string;

	path: string;

	params: Record<string, string>;

	query: Record<string, string | string[]>;

	matchedPath: string | null;

	body: unknown;
}
