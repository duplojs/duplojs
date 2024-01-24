import {makeMokedRequest} from "../mocks/request";

describe("request", () => {
	it("construct", () => {
		const {request, rawRequest} = makeMokedRequest({method: "GET", matchedPath: "/user/{userId}", url: "/user/42/?test=value"});
		
		expect(request.path).toBe("/user/42");
		expect(request.query).toEqual({test: "value"});
		expect(request.params).toEqual({userId: "42"});
		expect(request.rawRequest).toBe(rawRequest);
	});
});
