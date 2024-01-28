import {AlreadySent} from "../../../../scripts/lib/errors/alreadySent";

it("alreadySent", () => {
	const error = new AlreadySent();

	expect(error).instanceof(Error);
});
