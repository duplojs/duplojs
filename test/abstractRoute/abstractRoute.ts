import {DuploConfig, DuploInstance, zod} from "../../scripts/index";
import {parentPort} from "worker_threads";
import {IsOdd} from "../checker/checker";
import {HasRight} from "../process/process";

export const Abstract1 = (duplo: DuploInstance<DuploConfig>) => {
	const isOdd = IsOdd(duplo);
	const hasRight = HasRight(duplo);

	return duplo.declareAbstractRoute(
		"abstract1",
	)
	.extract({
		query: {
			number: zod.coerce.number()
		}
	})
	.check<typeof isOdd, "result", "odd">(
		isOdd,
		{
			input: p => p("number"),
			validate: i => i === "odd",
			catch: (res, i) => res.info(i).code(400).send("wrong"),
			output: (d, i, da) => d("result", da),
		}
	)
	.process(
		hasRight,
		{
			pickup: ["right"]
		}
	)
	.build(["number", "result", "right"]);
};

export const Abstract2 = (duplo: DuploInstance<DuploConfig>) => {
	const isOdd = IsOdd(duplo);
	const hasRight = HasRight(duplo);

	return duplo.declareAbstractRoute(
		"abstract2",
		{
			options: {
				test1: 90,
				test2: 700,
			}
		}
	)
	.check<typeof isOdd, "result", "odd">(
		isOdd,
		{
			input: p => 2,
			validate: i => i === "odd",
			catch: (res, i) => res.info(i).code(400).send("wrong"),
			output: (d, i, da) => d("result", da),
			options: {
				result: 22
			}
		}
	)
	.cut(({pickup: p}) => {
		parentPort?.postMessage("abstract result " + p("result"));
	})
	.process(
		hasRight,
		{
			options: {
				option1: 40,
			},
			input: p => p("result"),
		}
	)
	.custom(({pickup: p}) => {
		parentPort?.postMessage("abstract options test1 " + p("options").test1);
		parentPort?.postMessage("abstract options test2 " + p("options").test2);
	})
	.build();
};

export const Abstract3 = (duplo: DuploInstance<DuploConfig>) => {
	const isOdd = IsOdd(duplo);
	const hasRight = HasRight(duplo);

	return duplo.declareAbstractRoute(
		"abstract3",
	)
	.extract({
		query: {
			number: zod.coerce.number()
		}
	})
	.check<typeof isOdd, "result", "odd">(
		isOdd,
		{
			input: p => 2,
			validate: i => i === "odd",
			catch: (res, i) => res.info(i).code(400).send("wrong"),
			output: (d, i, da) => d("result", da),
			options: p => ({
				result: p("number")
			})
		}
	)
	.cut(({pickup: p}) => {
		parentPort?.postMessage("abstract result " + p("result"));
	})
	.process(
		hasRight,
		{
			options: p => ({
				option1: p("number"),
			}),
		}
	)
	.build();
};

export const Abstract4 = (duplo: DuploInstance<DuploConfig>) => duplo.declareAbstractRoute(
	"abstract4",
	{
		prefix: "pre"
	}
)
.build();

export const Abstract5 = (duplo: DuploInstance<DuploConfig>) => duplo.declareAbstractRoute(
	"abstract5",
	{
		allowExitProcess: true,
	}
)
.cut(({}, res, exit) => {
	exit();
	parentPort?.postMessage("no exit");
})
.build();

export const Abstract6 = (duplo: DuploInstance<DuploConfig>) => duplo
.declareAbstractRoute("abstract5.5")
.cut(({}, res) => {
	return {
		test: 57
	};
})
.custom(() => {
	return {
		test1: "test"
	};
})
.build(["test", "test1"])({pickup: ["test", "test1"]})
.declareAbstractRoute("abstract6")
.cut(({pickup: p}) => {
	parentPort?.postMessage("deepAbstract pickup test " + p("test"));
	parentPort?.postMessage("deepAbstract pickup test1 " + p("test1"));
})
.build(["test", "test1"]);

export const Abstract7 = (duplo: DuploInstance<DuploConfig>) => Abstract4(duplo)({ignorePrefix: true}).declareAbstractRoute(
	"abstract7",
	{
		prefix: "pre"
	}
)
.build();

export const Abstract8 = (duplo: DuploInstance<DuploConfig>) => Abstract4(duplo)().declareAbstractRoute(
	"abstract8",
	{
		prefix: "pre"
	}
)
.build();

export const Abstract9 = (duplo: DuploInstance<DuploConfig>) => duplo.declareAbstractRoute("abstract8")
.cut(() => ({yyy: 1}))
.build(["yyy"]);

