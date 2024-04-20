import {Checker, CheckerStep, CutStep, ProcessStep, makeHooksLifeCycle, zod} from "../../../../../scripts";
import {AbstractRoute} from "../../../mocks/duplose/abstractRoute";
import {Process} from "../../../mocks/duplose/process";

describe("abstract route", () => {
	it("construct", () => {
		const abstractRoute = new AbstractRoute("test", undefined, ["test"]);

		expect(abstractRoute.name).toBe("test");
		expect(abstractRoute.descs).toEqual([{type: "first", descStep: ["test"]}]);
	});

	it("copy hook", () => {
		const abstractRoute1 = new AbstractRoute("test", undefined, []);

		const localHooksLifeCycle = makeHooksLifeCycle();
		abstractRoute1.copyHook(localHooksLifeCycle);

		expect(localHooksLifeCycle.afterSend.subscribers[0]).toBe(abstractRoute1.hooksLifeCyle.afterSend);
	});

	it("set drop", () => {
		const abstractRoute = new AbstractRoute("test", undefined, []);
		abstractRoute.setDrop(["value"], ["test"]);

		expect(abstractRoute.drop).toEqual(["value"]);
		expect(abstractRoute.descs).toEqual([{type: "drop", descStep: ["test"]}]);
	});

	it("set options", () => {
		const abstractRoute = new AbstractRoute("test", undefined, []);
		abstractRoute.setOptions({test: "value"}, ["test"]);

		expect(abstractRoute.options).toEqual({test: "value"});
		expect(abstractRoute.descs).toEqual([{type: "options", descStep: ["test"]}]);
	});

	it("build", () => {
		const absr = new AbstractRoute("test", undefined, []);
		const abstractRoute = new AbstractRoute("test", absr.createInstance({pickup: ["test", ""]}, ["test"]).subAbstractRoute, []);
		absr.build();
		
		expect(abstractRoute.descs).toEqual([{type: "abstract", descStep: ["test"]}]);
		
		abstractRoute.setOptions({test: "value"}, []);
		abstractRoute.setDrop(["value"], []);
		abstractRoute.setExtract({
			body: zod.string(), 
			params: {test: zod.string()}
		}, undefined, []);

		const process1 = new Process("test1", []);
		const processStep = new ProcessStep(process1, {pickup: ["test"]});
		abstractRoute.addStepProcess(processStep, []);

		const checker = new Checker("test", []);
		const checkerStep = new CheckerStep(checker, {input: () => {}, catch: () => {}, skip: () => {}});
		abstractRoute.addStepChecker(checkerStep, ["test"]);

		const cut = new CutStep(() => {}, ["test"]);
		abstractRoute.addStepCut(cut, ["test"]);

		abstractRoute.setHandler(() => {}, []);

		abstractRoute.editingDuploseFunctions.push(() => {});
		abstractRoute.build();
	});
});
