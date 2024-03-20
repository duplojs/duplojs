import {Checker, makeServerHooksLifeCycle} from "../../../../scripts";
import makeCheckerBuilder from "../../../../scripts/lib/builder/checker";

it("checker builder", () => {
	const {createChecker} = makeCheckerBuilder(makeServerHooksLifeCycle(), Checker, [] as any);
	const fnc = () => ({}) as any;

	const checker = createChecker("test", "test")
	.options({test: "value"}, "test")
	.handler(fnc, "test")
	.preCompletion(
		"test",
		{},
		"test"
	)
	.build("test");

	expect(checker.options).toEqual({test: "value"});
	expect(checker.handler).toBe(fnc);
	expect(checker.preCompletions.test).toEqual({});
	expect(checker.descs).toEqual([
		{
			type: "first",
			descStep: ["test"]
		},
		{
			type: "options",
			descStep: ["test"]
		},
		{
			type: "handler",
			descStep: ["test"]
		},
		{
			type: "precompletion",
			descStep: ["test"]
		},
		{
			type: "drop",
			descStep: ["test"]
		},
	]);
});
