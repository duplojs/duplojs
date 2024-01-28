import {OutOfContextResponse} from "../../../../scripts/lib/errors/outOfContextResponse";

it("outOfContextResponse", () => {
	const error = new OutOfContextResponse();

	expect(error).instanceof(Error);
});
