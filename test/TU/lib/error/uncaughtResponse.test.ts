import {UncaughtResponse} from "../../../../scripts/lib/error/uncaughtResponse";

it("ucaughtResponse", () => {
	const error = new UncaughtResponse();

	expect(error).instanceof(Error);
});
