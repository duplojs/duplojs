import {serializeFile} from "../../../../scripts/lib/defaultHooks/serializeFile";
import {makeMokedResponse} from "../../mocks/response";
import "../../mocks/fakeFile";

it("serialize file", async() => {
	const {rawResponse, response} = makeMokedResponse();
	response.file = "serializeFile.txt";
	const result = await new Promise(r => {
		serializeFile({} as any, response).then(r);
		setTimeout(() => rawResponse.emit("close"));
	});

	expect(result).toBe(true);
	expect(rawResponse._getData()).toBe("");
});
