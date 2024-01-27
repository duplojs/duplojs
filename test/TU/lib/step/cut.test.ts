import {CutStep} from "../../../../scripts/lib/step/cut";

it("cut step", () => {
	const c = () => {};
	const cut = new CutStep(c, ["test"]);
	
	cut.build();
	expect(cut.short).toBe(c);
});
