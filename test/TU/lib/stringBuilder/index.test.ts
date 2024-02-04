import {condition, mapped, spread} from "../../../../scripts/lib/stringBuilder";

describe("string function", () => {
	it("mapped", () => {
		const test = mapped(["test1", "test2"], v => v);

		expect(test).toBe("test1\ntest2");
	});

	it("spread", () => {
		const test = spread("test1", "test2");

		expect(test).toBe("test1\ntest2");
	});

	it("condition", () => {
		const test = condition(false, () => "test2");

		expect(test).toBe("");
	});
});
