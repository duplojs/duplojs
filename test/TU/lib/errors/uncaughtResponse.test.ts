import {UncaughtResponse} from "../../../../scripts/lib/errors/uncaughtResponse";

it("ucaughtResponse", () => {
	const error = new UncaughtResponse();

	expect(error).instanceof(Error);
});
