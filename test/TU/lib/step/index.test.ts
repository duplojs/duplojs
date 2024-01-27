import {Step as DefaultStep} from "../../../../scripts/lib/step";

class Step extends DefaultStep{}

it("step", () => {
	const step = new Step("test");

	expect(step.name).toBe("test");
});
