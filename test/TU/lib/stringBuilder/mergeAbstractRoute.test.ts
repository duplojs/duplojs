import {mergeAbstractRouteFunctionString, subAbstractRoutesString} from "../../../../scripts/lib/stringBuilder/mergeAbstractRoute";

describe("string builder merge abstract route", () => {
	it("async", () => {
		const test = mergeAbstractRouteFunctionString("await", ["test", "test1"]);

		expect(test.includes("async function(")).toBe(true);
		expect(test.includes("\"test\": floor.pickup(\"test\"),")).toBe(true);
		expect(test.includes("\"test1\": floor.pickup(\"test1\"),")).toBe(true);
	});

	it("sync", () => {
		const test = mergeAbstractRouteFunctionString("", []);

		expect(test.includes("\tfunction(")).toBe(true);
	});

	it("subAbstractRoutesString async", () => {
		const test = subAbstractRoutesString(true, 1, "");

		expect(test.includes("await this.subAbstractRoutes[1]")).toBe(true);
	});

	it("subAbstractRoutesString sync", () => {
		const test = subAbstractRoutesString(false, 1, "");

		expect(test.includes("await this.subAbstractRoutes[1]")).toBe(false);
	});
});
