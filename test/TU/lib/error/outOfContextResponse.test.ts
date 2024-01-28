import {OutOfContextResponse} from "../../../../scripts/lib/error/outOfContextResponse";

it("outOfContextResponse", () => {
	const error = new OutOfContextResponse();

	expect(error).instanceof(Error);
});
