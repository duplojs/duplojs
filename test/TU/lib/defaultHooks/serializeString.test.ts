import {serializeString} from "../../../../scripts/lib/defaultHooks/serializeString";
import {makeMokedResponse} from "../../mocks/response";

describe("serialize string", () => {
	it("send string", async() => {
		const {rawResponse, response} = makeMokedResponse();
		response.headers["content-type"] = "text/plain";
		response.body = "test";
		const result = serializeString({} as any, response);
	
		expect(result).toBe(true);
		expect(rawResponse._getData()).toBe("test");
	});

	it("send number", async() => {
		const {rawResponse, response} = makeMokedResponse();
		response.headers["content-type"] = "text/plain";
		response.body = 0;
		const result = serializeString({} as any, response);
	
		expect(result).toBe(true);
		expect(rawResponse._getData()).toBe("0");
	});

	it("send null", async() => {
		const {rawResponse, response} = makeMokedResponse();
		response.headers["content-type"] = "text/plain";
		response.body = null;
		const result = serializeString({} as any, response);
	
		expect(result).toBe(true);
		expect(rawResponse._getData()).toBe("null");
	});
});
