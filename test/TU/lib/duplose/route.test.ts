import {Checker, zod} from "../../../../scripts";
import {CheckerStep} from "../../../../scripts/lib/step/checker";
import {CutStep} from "../../../../scripts/lib/step/cut";
import {ProcessStep} from "../../../../scripts/lib/step/process";
import {AbstractRoute} from "../../mocks/duplose/abstractRoute";
import {Process} from "../../mocks/duplose/process";
import {Route} from "../../mocks/duplose/route";


describe("route", () => {
	it("construct", () => {
		const route = new Route("GET", ["/", "test"], undefined, ["test"]);

		expect(route.method).toBe("GET");
		expect(route.paths).toEqual(["", "/test"]);
		expect(route.subAbstractRoute).toBe(undefined);
		expect(route.descs).toEqual([{type: "first", descStep: ["test"]}]);
	});
	

	it("build", () => {
		const absr = new AbstractRoute("test", undefined, []);
		const route = new Route("GET", [], absr.createInstance({pickup: ["test", ""]}, ["test"]).subAbstractRoute, []);
		absr.build();
		
		expect(route.descs).toEqual([{type: "abstract", descStep: ["test"]}]);
		
		route.setExtract({
			body: zod.string(), 
			params: {test: zod.string()}
		}, undefined, []);

		const process1 = new Process("test1", []);
		const processStep = new ProcessStep(process1, {pickup: ["test"]});
		route.addStepProcess(processStep, []);

		const checker = new Checker("test", []);
		const checkerStep = new CheckerStep(checker, {input: () => {}, catch: () => {}, skip: () => {}});
		route.addStepChecker(checkerStep, ["test"]);

		const cut = new CutStep(() => {}, ["test"]);
		route.addStepCut(cut, ["test"]);

		route.setHandler(() => {}, []);

		route.editingDuploseFunctions.push(() => {});
		route.build();
	});

	it("build error", () => {
		const route = new Route("GET", [], undefined, []);
		
		try {
			route.build();
		} catch (error){
			expect(error).instanceof(Error);
		}
	});
});
