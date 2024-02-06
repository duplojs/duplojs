import {Checker, CheckerStep, CutStep, ProcessStep, makeProcessBuilder, makeServerHooksLifeCycle} from "../../../../scripts";
import {Process} from "../../mocks/duplose/process";

describe("route builder", () => {
	const {createProcess} = makeProcessBuilder(makeServerHooksLifeCycle(), Process, []);

	it("handler", () => {
		const fnc = () => {};

		const process = createProcess("test", "test")
		.handler(fnc, "test")
		.build([], "test");
		
		expect(process.handler).toBe(fnc);
		expect(process.descs).toEqual([
			{
				type: "first",
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
		const process = createProcess("test")
		.options(
			{body: {}},
			"test"
		)
		.build();

		expect(process.options).toEqual({body: {}});
		expect(process.descs).toEqual([
			{
				type: "options",
				descStep: ["test"],
			}
		]);
	});

	it("input", () => {
		const fnc = () => {};
		const process = createProcess("test")
		.input(
			fnc,
			"test"
		)
		.build();

		expect(process.input).toEqual(fnc);
		expect(process.descs).toEqual([
			{
				type: "input",
				descStep: ["test"],
			}
		]);
	});

	it("hook", () => {
		const fnc = () => {};
		const process = createProcess("test")
		.hook("beforeSend", fnc)
		.build();

		expect(process.hooksLifeCyle.beforeSend.hasSubscriber(fnc)).toBe(true);
	});

	it("extracted", () => {
		const fnc = () => {};
		const process = createProcess("test")
		.extract(
			{body: {}},
			fnc,
			"test"
		)
		.build();

		expect(process.extracted).toEqual({body: {}});
		expect(process.errorExtract).toBe(fnc);
		expect(process.descs).toEqual([
			{
				type: "extracted",
				descStep: ["test"],
			}
		]);
	});

	it("process", () => {
		const process1 = new Process("test", []);
		const process = createProcess("test")
		.process(process1, {}, "test")
		.build();

		expect((process.steps[0] as ProcessStep).parent).toBe(process1);
		expect(process.descs).toEqual([
			{
				type: "process",
				index: 0,
				descStep: ["test"],
			}
		]);
	});

	it("checker", () => {
		const checker = new Checker("test", []);
		const process = createProcess("test")
		.check(checker, {} as any, "test")
		.build();

		expect((process.steps[0] as CheckerStep).parent).toBe(checker);
		expect(process.descs).toEqual([
			{
				type: "checker",
				index: 0,
				descStep: ["test"],
			}
		]);
	});

	it("cut", () => {
		const fnc = () => {};
		const process = createProcess("test")
		.cut(fnc, [], "test")
		.build();

		expect((process.steps[0] as CutStep).parent).toBe(fnc);
		expect(process.descs).toEqual([
			{
				type: "cut",
				index: 0,
				descStep: ["test"],
			}
		]);
	});
});
