import {Step as DefaultStep} from "../../../../scripts/lib/step";

class Step extends DefaultStep{}

it("step", () => {
	const step = new Step("test", 1);

	expect(step.name).toBe("test");
	expect(step.parent).toBe(1);
});
