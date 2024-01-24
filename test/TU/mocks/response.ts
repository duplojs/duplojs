import httpMocks from "node-mocks-http";
import {ExtendsResponse, Response} from "../../../scripts/lib/response";
import EventEmitter from "events";

export const makeMokedResponse = () => {
	const rawResponse = httpMocks.createResponse({
		eventEmitter: EventEmitter
	});
	const response = new ExtendsResponse(rawResponse);
	return {rawResponse, response};
};

export const trySend = (tryfnc: () => never) => {
	try {
		tryfnc();
	}
	catch (response){
		expect(response).instanceOf(Response);
		if(response instanceof Response){
			return response;
		}
	}
	
	throw new Error("Try function don't thow response.");
};
