import {routeFunctionString} from "../../../../scripts/lib/stringBuilder/route";

describe("string builder route", () => {
	it("main launchOnConstructRequest", () => {
		const test = routeFunctionString(true, true, false, false, false, false, false, "");

		expect(test.includes("launchOnConstructRequest")).toBe(true);
	});

	it("main launchOnConstructResponse", () => {
		const test = routeFunctionString(true, false, true, false, false, false, false, "");

		expect(test.includes("launchOnConstructResponse")).toBe(true);
	});

	it("main launchBeforeRouteExecution", () => {
		const test = routeFunctionString(true, false, false, true, false, false, false, "");

		expect(test.includes("launchBeforeRouteExecution")).toBe(true);
	});

	it("main launchOnError", () => {
		const test = routeFunctionString(true, false, false, false, true, false, false, "");

		expect(test.includes("launchOnError")).toBe(true);
	});

	it("main launchBeforeSend", () => {
		const test = routeFunctionString(true, false, false, false, false, true, false, "");

		expect(test.includes("launchBeforeSend")).toBe(true);
	});

	it("main launchAfterSend", () => {
		const test = routeFunctionString(true, false, false, false, false, false, true, "");

		expect(test.includes("launchAfterSend")).toBe(true);
	});
});
