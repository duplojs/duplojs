import {NotError} from "../../../../scripts/lib/error/notError";

it("NotError", () => {
	const error = new NotError();

	expect(error).instanceof(Error);
});
