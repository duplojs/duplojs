import {AnyFunction, Checker} from "../../../../scripts";
import {CheckerStep} from "../../../../scripts/lib/step/checker";

describe("checker step", () => {
	it("without options", () => {
		const checker = new Checker("test", []);
		const c = () => {};
		const i = () => {};
		const s = () => {};
		const checkerStep = new CheckerStep(checker, {
			catch: c, input: i, indexing: "test", result: "test", skip: s
		});
	
		checkerStep.build();
		expect(checkerStep.input).toBe(i);
		expect(checkerStep.catch).toBe(c);
		expect(checkerStep.skip).toBe(s);
		expect(checkerStep.indexing).toBe("test");
		expect(checkerStep.result).toBe("test");
	});

	it("object options", () => {
		const checker = new Checker("test", []);
		const checkerStep = new CheckerStep(checker, {catch: () => {}, input: () => {}, options: {}});
	
		checkerStep.build();
		expect(checkerStep.options).toEqual({});
	});

	it("function options", () => {
		const checker = new Checker("test", []);
		const checkerStep = new CheckerStep(checker, {catch: () => {}, input: () => {}, options: () => ({})});
	
		checkerStep.build();
		expect(checkerStep.options).instanceof(Function);
		(checkerStep.options as AnyFunction)();
	});
});
