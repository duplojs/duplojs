import {serializeJSON} from "../../../../scripts/lib/defaultHooks/serializeJSON";
import {makeMokedResponse} from "../../mocks/response";

it("serialize JSON", async() => {
	const {rawResponse, response} = makeMokedResponse();
	response.headers["content-type"] = "application/json";
	response.body = {test: "value"};
	const result = serializeJSON({} as any, response);
	
	expect(result).toBe(true);
	expect(rawResponse._getData()).toBe(JSON.stringify({test: "value"}));
});
