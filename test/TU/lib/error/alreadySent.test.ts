import {AlreadySent} from "../../../../scripts/lib/error/alreadySent";

it("alreadySent", () => {
	const error = new AlreadySent();

	expect(error).instanceof(Error);
});
