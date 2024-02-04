import {Checker, zod} from "../../../../scripts";
import {CheckerStep} from "../../../../scripts/lib/step/checker";
import {CutStep} from "../../../../scripts/lib/step/cut";
import {ProcessStep} from "../../../../scripts/lib/step/process";
import {Process} from "../../mocks/duplose/process";

describe("process", () => {
	it("construct", () => {
		const process = new Process("test", ["test"]);

		expect(process.name).toBe("test");
		expect(process.descs).toEqual([{type: "first", descStep: ["test"]}]);
	});

	it("set drop", () => {
		const process = new Process("test", []);
		process.setDrop(["value"], ["test"]);

		expect(process.drop).toEqual(["value"]);
		expect(process.descs).toEqual([{type: "drop", descStep: ["test"]}]);
	});

	it("set options", () => {
		const process = new Process("test", []);
		process.setOptions({test: "value"}, ["test"]);

		expect(process.options).toEqual({test: "value"});
		expect(process.descs).toEqual([{type: "options", descStep: ["test"]}]);
	});

	it("set input", () => {
		const process = new Process("test", []);
		const input = () => {};
		process.setInput(input, ["test"]);

		expect(process.input).toEqual(input);
		expect(process.descs).toEqual([{type: "input", descStep: ["test"]}]);
	});

	it("build", () => {
		const process = new Process("test", []);
		process.setOptions({test: "value"}, []);
		process.setInput(() => {}, []);
		process.setDrop(["value"], []);
		process.setExtract({
			body: zod.string(), 
			params: {test: zod.string()}
		}, undefined, []);

		const process1 = new Process("test1", []);
		const processStep = new ProcessStep(process1, {pickup: ["test"]});
		process.addStepProcess(processStep, []);

		const checker = new Checker("test", []);
		const checkerStep = new CheckerStep(checker, {input: () => {}, catch: () => {}, skip: () => {}});
		process.addStepChecker(checkerStep, ["test"]);

		const cut = new CutStep(() => {}, ["test"]);
		process.addStepCut(cut, ["test"]);

		process.setHandler(() => {}, []);

		process.editingDuploseFunctions.push(() => {});
		process.build();
	});
});
