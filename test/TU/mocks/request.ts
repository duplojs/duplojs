import httpMocks from "node-mocks-http";
import {ExtendsRequest, HttpMethods} from "../../../scripts/lib/request";
import {pathToStringRegExp} from "../../../scripts/lib/utile";

export interface makeMokedRequestParams{
	method: HttpMethods
	url: string
	matchedPath: string
}

export const makeMokedRequest = ({method, matchedPath, url}: makeMokedRequestParams) => {
	const match = new RegExp(pathToStringRegExp(matchedPath).replace(/^\//, "").replace(/\/$/, "")).exec(url);
	if(!match){
		throw new Error("Url not match.");
	}
	const params = match.groups || {};
	const rawRequest = httpMocks.createRequest({
		method,
		url,
	});
	const request = new ExtendsRequest(rawRequest, params, matchedPath);

	return {rawRequest, request};
};
