import {Checker, CheckerStep, CutStep, ProcessStep, makeAbstractRouteBuilder, makeProcessBuilder, makeServerHooksLifeCycle} from "../../../../scripts";
import {AbstractRoute} from "../../mocks/duplose/abstractRoute";
import {Process} from "../../mocks/duplose/process";

describe("route builder", () => {
	const {declareAbstractRoute} = makeAbstractRouteBuilder(makeServerHooksLifeCycle(), AbstractRoute, []);

	it("handler", () => {
		const fnc = () => {};
		const absr = new AbstractRoute("test", undefined, []);
		const abstract = declareAbstractRoute(
			"test", 
			absr.createInstance({pickup: ["test", ""]}, ["test"]).subAbstractRoute, 
			"test"
		)
		.handler(fnc, "test")
		.build([], "test");

		const par = abstract().subAbstractRoute.parent as AbstractRoute;
		
		expect(par.handler).toBe(fnc);
		expect(par.descs).toEqual([
			{
				type: "first",
				descStep: ["test"],
			},
			{
				type: "abstract",
				descStep: ["test"],
			},
			{
				type: "handler",
				descStep: ["test"],
			},
			{
				type: "drop",
				descStep: ["test"],
			},
		]);
	});

	it("options", () => {
		const abstract = declareAbstractRoute("test", undefined)
		.options(
			{body: {}},
			"test"
		)
		.build();

		const par = abstract().subAbstractRoute.parent as AbstractRoute;

		expect(par.options).toEqual({body: {}});
		expect(par.descs).toEqual([
			{
				type: "options",
				descStep: ["test"],
			}
		]);
	});

	it("hook", () => {
		const fnc = () => {};
		const abstract = declareAbstractRoute("test", undefined)
		.hook("beforeSend", fnc)
		.build();

		const par = abstract().subAbstractRoute.parent as AbstractRoute;

		expect(par.hooksLifeCyle.beforeSend.hasSubscriber(fnc)).toBe(true);
	});

	it("extracted", () => {
		const fnc = () => {};
		const abstract = declareAbstractRoute("test", undefined)
		.extract(
			{params: {}},
			fnc,
			"test"
		)
		.build();

		const par = abstract().subAbstractRoute.parent as AbstractRoute;

		expect(par.extracted).toEqual({params: {}});
		expect(par.errorExtract).toBe(fnc);
		expect(par.descs).toEqual([
			{
				type: "extracted",
				descStep: ["test"],
			}
		]);
	});

	it("process", () => {
		const process1 = new Process("test", []);
		const abstract = declareAbstractRoute("test", undefined)
		.process(process1, {}, "test")
		.build();

		const par = abstract().subAbstractRoute.parent as AbstractRoute;

		expect((par.steps[0] as ProcessStep).parent).toBe(process1);
		expect(par.descs).toEqual([
			{
				type: "process",
				index: 0,
				descStep: ["test"],
			}
		]);
	});

	it("checker", () => {
		const checker = new Checker("test", []);
		const abstract = declareAbstractRoute("test", undefined)
		.check(checker, {} as any, "test")
		.build();

		const par = abstract().subAbstractRoute.parent as AbstractRoute;

		expect((par.steps[0] as CheckerStep).parent).toBe(checker);
		expect(par.descs).toEqual([
			{
				type: "checker",
				index: 0,
				descStep: ["test"],
			}
		]);
	});

	it("cut", () => {
		const fnc = () => ({});
		const abstract = declareAbstractRoute("test", undefined)
		.cut(fnc, [], "test")
		.build();

		const par = abstract().subAbstractRoute.parent as AbstractRoute;

		expect((par.steps[0] as CutStep).parent).toBe(fnc);
		expect(par.descs).toEqual([
			{
				type: "cut",
				index: 0,
				descStep: ["test"],
			}
		]);
	});
});
