import {parsingBody} from "../../../../scripts/lib/defaultHooks/parsingBody";
import {makeMokedRequest} from "../../mocks/request";

describe("parsing body", () => {
	it("parsing text", async() => {
		const {rawRequest, request} = makeMokedRequest({method: "POST", matchedPath: "/", url: "/"});
		request.headers["content-type"] = "text/plain";
		const result = await new Promise(r => {
			parsingBody(request).then(r);
			rawRequest.emit("data", "test");
			rawRequest.emit("end");
		});

		expect(result).toBe(true);
		expect(request.body).toBe("test");
	});

	it("parsing json", async() => {
		const {rawRequest, request} = makeMokedRequest({method: "POST", matchedPath: "/", url: "/"});
		request.headers["content-type"] = "application/json";
		const result = await new Promise(r => {
			parsingBody(request).then(r);
			rawRequest.emit("data", JSON.stringify({test: "value"}));
			rawRequest.emit("end");
		});

		expect(result).toBe(true);
		expect(request.body).toEqual({test: "value"});
	});
});
