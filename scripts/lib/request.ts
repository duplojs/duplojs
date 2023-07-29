import {IncomingHttpHeaders, IncomingMessage} from "http";
import extractPathAndQueryFromUrl from "./extractPathAndQueryFromUrl";
import {anotherbackConfig} from "./main";

export interface Request{
	readonly rawRequest: InstanceType<typeof IncomingMessage>;
	readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
	getHeader(key: string): undefined | string | string[];
	getHeaders(): IncomingHttpHeaders;
	url: string;
	host: string;
	origin: string;
	path: string;
	query: Record<string, string>;
	params: Record<string, string>;
	body?: unknown;
	cookies: Record<string, string>;
}

export default function makeRequest(request: Request["rawRequest"], config: anotherbackConfig): Request
{
	const extracted = extractPathAndQueryFromUrl(request.url);

	return {
		rawRequest: request,
		get method(){
			return request.method as Request["method"];
		},
		getHeader(key){
			return request.headers[key.toLowerCase()];
		},
		getHeaders(){
			return request.headers;
		},
		get url(){
			return request.url || "";
		},
		get host(){
			return request.headers.host || "";
		},
		get origin(){
			return request.headers.origin || "";
		},
		cookies: {},
		path: extracted.path,
		query: extracted.query || {},
		params: {},
	};
}
