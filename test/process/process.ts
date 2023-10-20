import {parentPort} from "worker_threads";
import {DuploConfig, DuploInstance, zod} from "../../scripts";
import {IsOdd} from "../checker/checker";

export const IsAdmin = (duplo: DuploInstance<DuploConfig>) => {
	const isOdd = IsOdd(duplo);
	const hasRight = HasRight(duplo);

	return duplo.createProcess(
		"isAdmin",
		{
			options: {
				testOption1: "test1",
				testOption2: "test2",
			},
			input: () => 22,
		}
	)
	.extract({
		headers: {
			admin: zod.literal("true"),
		}, 
	})
	.check<typeof isOdd, "result", "odd">(
		isOdd,
		{
			input: p => p("input"),
			validate: i => i === "odd",
			catch: (res, i) => res.info(i).code(400).send("wrong"),
			output: (d, i, da) => d("result", da),
			options: {
				result: 55,
			}
		}
	)
	.process(
		hasRight,
		{
			pickup: ["right"]
		}
	)
	.cut(({pickup: p}) => {
		parentPort?.postMessage("process test cut");

		return {
			pick: {
				input: p("input"),
				options: p("options"),
				result: p("result"),
				admin: p("admin"),
				right: p("right"),
			}
		};
	})
	.build(["pick"]);
};

export const IsManager = (duplo: DuploInstance<DuploConfig>) => {
	const isOdd = IsOdd(duplo);
	const hasRight = HasRight(duplo);

	return duplo.createProcess(
		"isManager",
		{
			options: {
				testOption1: "test1",
				testOption2: "test2",
			},
			input: () => 22,
		}
	)
	.extract({
		query: {
			skip: zod.literal("true").optional()
		}
	})
	.check<typeof isOdd, "result", "odd">(
		isOdd,
		{
			input: p => p("input"),
			validate: i => i === "odd",
			catch: (res, i) => res.info(i).code(400).send("wrong"),
			output: (d, i, da) => d("result", da),
			skip: p => p("skip") === "true",
		}
	)
	.process(
		hasRight,
		{
			skip: p => p("skip") === "true",
		}
	)
	.build();
};

export const IsCustomer = (duplo: DuploInstance<DuploConfig>) => {
	const hasRight = HasRight(duplo);

	return duplo.createProcess(
		"isCustomer",
		{
			input: () => 22,
		}
	)
	.process(
		hasRight,
		{
			input: p => p("input"),
		}
	)
	.build();
};

export const IsOwner = (duplo: DuploInstance<DuploConfig>) => {
	const hasRight = HasRight(duplo);

	return duplo.createProcess(
		"isOwner",
		{
			options: {
				option1: 23,
			},
		}
	)
	.cut(({pickup: p}) => {
		parentPort?.postMessage("process options " + p("options").option1);
	})
	.process(
		hasRight,
		{
			options: {
				option2: 222
			},
		}
	)
	.build();
};

export const IsUser = (duplo: DuploInstance<DuploConfig>) => {
	const isOdd = IsOdd(duplo);
	const hasRight = HasRight(duplo);

	return duplo.createProcess(
		"isUser",
		{
			options: {
				option1: 40,
			},
		}
	)
	.cut(({pickup: p}) => {
		parentPort?.postMessage("process options " + p("options").option1);
	})
	.process(
		hasRight,
		{
			options: p => ({
				option2: p("options").option1 + 5
			}),
		}
	)
	.check<typeof isOdd, "result", "odd">(
		isOdd,
		{
			input: p => 2,
			validate: i => i === "odd",
			catch: (res, i) => res.info(i).code(400).send("wrong"),
			output: (d, i, da) => d("result", da),
			options: p => ({
				result: p("options").option1
			}),
		}
	)
	.cut(({pickup: p}) => {
		parentPort?.postMessage("checker result " + p("result"));
	})
	.build();
};

export const HasRight = (duplo: DuploInstance<DuploConfig>) => duplo.createProcess(
	"hasRight",
	{
		options: {
			option1: 1,
			option2: 2,
		},
		input: () => 30
	}
)
.custom(({pickup: p}) => {
	parentPort?.postMessage("process test custom");
	parentPort?.postMessage("process options1 " + p("options").option1);
	parentPort?.postMessage("process options2 " + p("options").option2);
	parentPort?.postMessage("process input " + p("input"));

	return {
		right: true,
	};
})
.build(["right"]);

export const ProcessExit = (duplo: DuploInstance<DuploConfig>) => duplo.createProcess(
	"processExit",
	{
		allowExitProcess: true
	}
)
.cut(({}, res, exit) => {
	exit();
	parentPort?.postMessage("no exit");
})
.build();
