import {checkerStep, cutStep, extractedTry, extractedType, extractedTypeKey, hookBody, processDrop, processStep, routeFunctionString, skipStep, subAbstractRouteString} from "../../../../scripts/lib/stringBuilder/route";

describe("string builder route", () => {
	it("main launchOnConstructRequest", () => {
		const test = routeFunctionString(false, true, false, false, false, false, false, "");

		expect(test.includes("launchOnConstructRequest")).toBe(true);
	});

	it("main launchOnConstructResponse", () => {
		const test = routeFunctionString(false, false, true, false, false, false, false, "");

		expect(test.includes("launchOnConstructResponse")).toBe(true);
	});

	it("main launchBeforeRouteExecution", () => {
		const test = routeFunctionString(false, false, false, true, false, false, false, "");

		expect(test.includes("launchBeforeRouteExecution")).toBe(true);
	});

	it("main launchOnError", () => {
		const test = routeFunctionString(false, false, false, false, true, false, false, "");

		expect(test.includes("launchOnError")).toBe(true);
	});

	it("main launchBeforeSend", () => {
		const test = routeFunctionString(false, false, false, false, false, true, false, "");

		expect(test.includes("launchBeforeSend")).toBe(true);
	});

	it("main launchAfterSend", () => {
		const test = routeFunctionString(false, false, false, false, false, false, true, "");

		expect(test.includes("launchAfterSend")).toBe(true);
	});

	it("async handler", () => {
		const test = routeFunctionString(true, false, false, false, false, false, false, "");

		expect(test.includes("await this.handler")).toBe(true);
	});

	it("subAbstractRoute async", () => {
		const test = subAbstractRouteString(true, "");

		expect(test.includes("await this.subAbstractRoute")).toBe(true);
	});

	it("subAbstractRoute sync", () => {
		const test = subAbstractRouteString(false, "");

		expect(test.includes("result = this.subAbstractRoute")).toBe(true);
	});

	it("hook body", () => {
		const test = hookBody();

		expect(test).toBeTypeOf("string");
	});

	it("extractedTry", () => {
		const test = extractedTry("");

		expect(test).toBeTypeOf("string");
	});

	it("extractedType", () => {
		const test = extractedType("key");
		
		expect(test.match(/\"key\"/g)?.length).toBe(4);
	});

	it("extractedTypeKey", () => {
		const test = extractedTypeKey("key1", "key2");
		
		expect(test.match(/\"key1\"/g)?.length).toBe(3);
		expect(test.match(/\"key2\"/g)?.length).toBe(4);
	});

	it("cutStep async", () => {
		const test = cutStep(true, 1, "");
		
		expect(test.includes("await this.steps[1]")).toBe(true);
	});

	it("cutStep sync", () => {
		const test = cutStep(false, 1, "");
		
		expect(test.includes("result = this.steps[1]")).toBe(true);
	});

	it("checkerStep sync", () => {
		const test = checkerStep(false, 1, false, false, false, false);
		
		expect(test.includes("result = this.steps[1]")).toBe(true);
		expect(test.includes("this.steps[1].options(floor.pickup)")).toBe(false);
	});

	it("checkerStep async", () => {
		const test = checkerStep(true, 1, true, false, true, true);
		
		expect(test.includes("result = await this.steps[1]")).toBe(true);
		expect(test.includes("this.steps[1].result !== result.info")).toBe(true);
		expect(test.includes("this.steps[1].options(floor.pickup)")).toBe(true);
	});

	it("processStep async", () => {
		const test = processStep(true, 1, false, true, "");
		
		expect(test.includes("result = await this.steps[1]")).toBe(true);
		expect(test.includes("this.steps[1].options(floor.pickup)")).toBe(true);
	});

	it("processStep sync", () => {
		const test = processStep(false, 1, true, false, "");
		
		expect(test.includes("result = this.steps[1]")).toBe(true);
		expect(test.includes("this.steps[1].input(floor.pickup)")).toBe(true);
	});

	it("skipStep true", () => {
		const test = skipStep(true, 1, "");
		
		expect(test.includes("this.steps[1].skip(floor.pickup)")).toBe(true);
	});

	it("skipStep false", () => {
		const test = skipStep(false, 1, "");
		
		expect(test).toBe("");
	});

	it("processDrop false", () => {
		const test = processDrop("key");
		
		expect(test.includes("floor.drop(\"key\", result[\"key\"]);")).toBe(true);
	});
});
