import {Checker, makeHooksLifeCycle, zod} from "../../../../scripts";
import {CheckerStep} from "../../../../scripts/lib/step/checker";
import {CutStep} from "../../../../scripts/lib/step/cut";
import {ProcessStep} from "../../../../scripts/lib/step/process";
import {Duplose, defaultErrorExtract} from "../../mocks/duplose";
import {Process} from "../../mocks/duplose/process";

describe("duplose", () => {
	it("construct", () => {
		const duplose = new Duplose(["test"]);

		expect(duplose.errorExtract).toBe(defaultErrorExtract);
		expect(duplose.descs).toEqual([{type: "first", descStep: ["test"]}]);
	});

	it("set handler", () => {
		const duplose = new Duplose([]);

		const handler = () => {};
		duplose.setHandler(handler, ["test"]);
		
		expect(duplose.handler).toBe(handler);
		expect(duplose.descs).toEqual([{type: "handler", descStep: ["test"]}]);
	});

	it("add cut", () => {
		const duplose = new Duplose([]);

		const cut = new CutStep(() => {}, []);
		duplose.addStepCut(cut, ["test"]);
		
		expect(duplose.steps[0]).toBe(cut);
		expect(duplose.descs).toEqual([{type: "cut", index: 0, descStep: ["test"]}]);
	});

	it("add checker", () => {
		const duplose = new Duplose([]);

		const checker = new Checker("test", []);
		const checkerStep = new CheckerStep(checker, {input: () => {}, catch: () => {}});
		duplose.addStepChecker(checkerStep, ["test"]);
		
		expect(duplose.steps[0]).toBe(checkerStep);
		expect(duplose.descs).toEqual([{type: "checker", index: 0, descStep: ["test"]}]);
	});

	it("add process", () => {
		const duplose = new Duplose([]);

		const process = new Process("test", []);
		const processStep = new ProcessStep(process, {});
		duplose.addStepProcess(processStep, ["test"]);
		
		expect(duplose.steps[0]).toBe(processStep);
		expect(duplose.descs).toEqual([{type: "process", index: 0, descStep: ["test"]}]);
	});

	it("copy hook step", () => {
		const duplose = new Duplose([]);

		const process = new Process("test", []);
		const processStep = new ProcessStep(process, {});
		duplose.addStepProcess(processStep, ["test"]);
		
		const localHooksLifeCycle = makeHooksLifeCycle();
		duplose.copyStepHooks(localHooksLifeCycle);

		expect(localHooksLifeCycle.afterSend.subscribers[0]).toBe(process.hooksLifeCyle.afterSend);
	});

	it("set extract", () => {
		const duplose = new Duplose([]);
		const extract = {body: {test: zod.string()}};
		const extractError = () => {};
		duplose.setExtract(extract, extractError, ["test"]);

		expect(duplose.extracted).toBe(extract);
		expect(duplose.errorExtract).toBe(extractError);
		expect(duplose.descs).toEqual([{type: "extracted", descStep: ["test"]}]);
	});
});
