import {AnyFunction} from "../../../../scripts";
import {ProcessStep} from "../../../../scripts/lib/step/process";
import {Process} from "../../mocks/duplose/process";

describe("process step", () => {
	it("default options", () => {
		const process = new Process("test", []);
		const i = () => {};
		const s = () => {};
		const processStep = new ProcessStep(process, {pickup: ["test"], input: i, skip: s});

		processStep.build();
		expect(processStep.input).toBe(i);
		expect(processStep.skip).toBe(s);
	});

	it("object options", () => {
		const process = new Process("test", []);
		const processStep = new ProcessStep(process, {pickup: ["test"], options: {}});

		processStep.build();
		expect(processStep.options).toEqual({});
	});

	it("function options", () => {
		const process = new Process("test", []);
		const processStep = new ProcessStep(process, {pickup: ["test"], options: () => {}});

		processStep.build();
		expect(processStep.options).instanceof(Function);
		(processStep.options as AnyFunction)();
	});
});
