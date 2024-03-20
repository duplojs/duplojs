import {Checker} from "../../../../scripts";


describe("checker", () => {
	it("construct", () => {
		const checker = new Checker("test", ["test"]);

		expect(checker.name).toBe("test");
		expect(checker.descs).toEqual([{type: "first", descStep: ["test"]}]);
	});

	it("set options", () => {
		const checker = new Checker("test", []);
		checker.setOptions({test: "value"}, ["test"]);

		expect(checker.options).toEqual({test: "value"});
		expect(checker.descs).toEqual([{type: "options", descStep: ["test"]}]);
	});

	it("set handler", () => {
		const checker = new Checker("test", []);

		const handler = () => ({}) as any;
		checker.setHandler(handler, ["test"]);

		expect(checker.handler).toEqual(handler);
		expect(checker.descs).toEqual([{type: "handler", descStep: ["test"]}]);
	});

	it("add precompletion", () => {
		const checker = new Checker("test", []);

		checker.preCompletion("test1", {result: "r"}, ["test"]);

		expect(checker.preCompletions).toEqual({test1: {result: "r"}});
		expect(checker.descs).toEqual([{type: "precompletion", descStep: ["test"]}]);
	});
});
