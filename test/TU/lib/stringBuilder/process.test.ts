import {handlerFunctionString, processFunctionString} from "../../../../scripts/lib/stringBuilder/process";

describe("string builder process", () => {
	it("async", () => {
		const test = processFunctionString(true, false, "await", ["test", "test1"]);

		expect(test.includes("async function(")).toBe(true);
		expect(test.includes("\"test\": floor.pickup(\"test\"),")).toBe(true);
		expect(test.includes("\"test1\": floor.pickup(\"test1\"),")).toBe(true);
		expect(test.includes("floor.drop(\"input\", input);")).toBe(true);
	});

	it("sync", () => {
		const test = processFunctionString(false, true, "", []);

		expect(test.includes("\tfunction(")).toBe(true);
		expect(test.includes("floor.drop(\"options\", options);")).toBe(true);
	});

	it("handler sync", () => {
		const test = handlerFunctionString(false);

		expect(test.includes("await this.handler")).toBe(false);
	});

	it("handler async", () => {
		const test = handlerFunctionString(true);

		expect(test.includes("await this.handler")).toBe(true);
	});
});
