import {NotError} from "../../../../scripts/lib/errors/notError";

it("NotError", () => {
	const error = new NotError();

	expect(error).instanceof(Error);
});
