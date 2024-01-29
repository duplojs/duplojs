import {DuploConfig, DuploInstance, zod} from "../../../scripts/index";
import {parentPort} from "worker_threads";
import {IsOdd} from "../checker/checker";
import {HasRight} from "../process/process";

export const Abstract1 = (duplo: DuploInstance<DuploConfig>) => {
	const isOdd = IsOdd(duplo);
	const hasRight = HasRight(duplo);

	return duplo
	.declareAbstractRoute("abstract1")
	.extract({
		query: {
			number: zod.coerce.number()
		},
	})
	.check(
		isOdd,
		{
			input: p => p("number"),
			result: "odd",
			catch: (res, i, d, p) => {
				parentPort?.postMessage("result " + d);
				parentPort?.postMessage("pickup number " + p("number"));
				res.info(i).code(400).send("wrong");
			},
			indexing: "result",
		}
	)
	.process(
		hasRight,
		{
			pickup: ["right"]
		}
	)
	.build(["result", "number", "right"]);
};

export const Abstract2 = (duplo: DuploInstance<DuploConfig>) => {
	const isOdd = IsOdd(duplo);
	const hasRight = HasRight(duplo);

	return duplo.declareAbstractRoute("abstract2")
	.options({
		test1: 90,
		test2: 700,
	})
	.check(
		isOdd,
		{
			input: p => 2,
			result: ["odd"],
			catch: (res, i) => res.info(i).code(400).send("wrong"),
			indexing: "result",
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
	.cut(({pickup: p}) => {
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
		},
	})
	.check(
		isOdd,
		{
			input: p => 2,
			result: "odd",
			catch: (res, i) => res.info(i).code(400).send("wrong"),
			indexing: "result",
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

export const Abstract5 = (duplo: DuploInstance<DuploConfig>) => duplo.declareAbstractRoute("abstract5").build();

export const Abstract6 = (duplo: DuploInstance<DuploConfig>) => duplo
.declareAbstractRoute("abstract5.5")
.cut(
	(f) => {
		return {
			test: 57,
			toto: "test"
		};
	}, 
	["test", "toto"]
)
.build(["test", "toto"])({pickup: ["test", "toto"]})
.declareAbstractRoute("abstract6")
.cut(({pickup: p}) => {
	parentPort?.postMessage("deepAbstract pickup test " + p("test"));
})
.build(["test", "toto"]);

export const Abstract9 = (duplo: DuploInstance<DuploConfig>) => duplo.declareAbstractRoute("abstract8")
.cut(() => ({yyy: 1}), ["yyy"])
.build(["yyy"]);

