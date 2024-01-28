import {abstractRouteFunctionString} from "../../../../scripts/lib/stringBuilder/abstractRoute";

describe("string builder abstract route", () => {
	it("async", () => {
		const test = abstractRouteFunctionString(false, "await", ["test", "test1"]);

		expect(test.includes("async function(")).toBe(true);
		expect(test.includes("\"test\": floor.pickup(\"test\"),")).toBe(true);
		expect(test.includes("\"test1\": floor.pickup(\"test1\"),")).toBe(true);
	});

	it("sync", () => {
		const test = abstractRouteFunctionString(true, "", []);

		expect(test.includes("\tfunction(")).toBe(true);
		expect(test.includes("floor.drop(\"options\", options);")).toBe(true);
	});
});
