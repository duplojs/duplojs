import {Checker, CheckerStep, CutStep, ProcessStep, makeRouteBuilder, makeServerHooksLifeCycle} from "../../../../scripts";
import {AbstractRoute} from "../../mocks/duplose/abstractRoute";
import {Process} from "../../mocks/duplose/process";
import {Route} from "../../mocks/duplose/route";

describe("route builder", () => {
	const {declareRoute} = makeRouteBuilder(
		makeServerHooksLifeCycle(), 
		Route, 
		{
			GET: [],
			POST: [],
			PATCH: [],
			PUT: [],
			HEAD: [],
			DELETE: [],
			OPTIONS: [],
		}
	);

	it("handler", () => {
		const fnc = () => {};
		const absr = new AbstractRoute("test", undefined, []);
		const route = declareRoute(
			"GET", 
			["/"], 
			absr.createInstance({pickup: ["test", ""]}, ["test"]).subAbstractRoute, 
			"test"
		).handler(fnc, "test");
		
		expect(route.method).toBe("GET");
		expect(route.paths).toEqual([""]);
		expect(route.handler).toBe(fnc);
		expect(route.subAbstractRoute?.parent).toBe(absr);
		expect(route.descs).toEqual([
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
		]);
	});

	it("hook", () => {
		const fnc = () => {};
		const route = declareRoute("GET", "/")
		.hook("beforeSend", fnc)
		.handler(() => {});

		expect(route.hooksLifeCyle.beforeSend.hasSubscriber(fnc)).toBe(true);
	});

	it("extracted", () => {
		const fnc = () => {};
		const route = declareRoute("GET", "/")
		.extract(
			{body: {}},
			fnc,
			"test"
		)
		.handler(() => {});

		expect(route.extracted).toEqual({body: {}});
		expect(route.errorExtract).toBe(fnc);
		expect(route.descs).toEqual([
			{
				type: "extracted",
				descStep: ["test"],
			}
		]);
	});

	it("process", () => {
		const process = new Process("test", []);
		const route = declareRoute("GET", "/")
		.process(process, {}, "test")
		.handler(() => {});

		expect((route.steps[0] as ProcessStep).parent).toBe(process);
		expect(route.descs).toEqual([
			{
				type: "process",
				index: 0,
				descStep: ["test"],
			}
		]);
	});

	it("checker", () => {
		const checker = new Checker("test", []);
		const route = declareRoute("GET", "/")
		.check(checker, {} as any, "test")
		.handler(() => {});

		expect((route.steps[0] as CheckerStep).parent).toBe(checker);
		expect(route.descs).toEqual([
			{
				type: "checker",
				index: 0,
				descStep: ["test"],
			}
		]);
	});

	it("cut", () => {
		const fnc = () => ({});
		const route = declareRoute("GET", "/")
		.cut(fnc, [], "test")
		.handler(() => {});

		expect((route.steps[0] as CutStep).parent).toBe(fnc);
		expect(route.descs).toEqual([
			{
				type: "cut",
				index: 0,
				descStep: ["test"],
			}
		]);
	});
});
