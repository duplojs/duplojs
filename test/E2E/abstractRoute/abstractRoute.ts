import {DuploConfig, DuploInstance, ExtractObject, Request, Response, zod} from "../../../scripts/index";
import {parentPort} from "worker_threads";
import {IsOdd} from "../checker/checker";
import {HasRight} from "../process/process";
import {AssertType} from "../index.d";
import {ZodType} from "zod";

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
		const result = p("result");
		type testType = AssertType<typeof result, number>;
		return {};
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
		const options = p("options");
		type testType = AssertType<typeof options, {test1: number, test2: number}>;
		return {};
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

		return {};
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
	const test = p("test");
	type testType = AssertType<typeof test, number>;
	return {};
})
.build(["test", "toto"]);

export const Abstract9 = (duplo: DuploInstance<DuploConfig>) => duplo.declareAbstractRoute("abstract9")
.cut(() => ({yyy: 1}), ["yyy"])
.build(["yyy"]);

interface requestTest extends Request{
	test(): this
}

interface responseTest extends Response{
	test(): this
}

interface extractObjectTest extends ExtractObject{
	test?: Record<string, ZodType> | ZodType,
}

export const Abstract10 = (duplo: DuploInstance<DuploConfig>) => duplo.declareAbstractRoute<
	requestTest, 
	responseTest, 
	extractObjectTest
>("abstract10")
.extract({
	test: zod.string()
})
.cut(({}, res, req) => {
	res.test;
	req.test;

	return {};
})
.build();

interface requestTest1 extends Request{
	test1(): this
}

interface responseTest1 extends Response{
	test1(): this
}

interface extractObjectTest1 extends ExtractObject{
	test1?: Record<string, ZodType> | ZodType,
}

export const Abstract11 = (duplo: DuploInstance<DuploConfig>) => duplo.declareAbstractRoute<
	requestTest1, 
	responseTest1, 
	extractObjectTest1
>("abstract11")
.extract({
	test1: zod.string()
})
.cut(({}, res, req) => {
	res.test1;
	req.test1;

	return {};
})
.build();

export const testTypeAbstractRoute = (duplo: DuploInstance<DuploConfig>) => duplo.declareAbstractRoute("testTypeAbstractRoute")
.extract({
	query: {
		test: zod.string()
	}
})
.cut(() => ({}), [])
.cut(() => ({}))
.cut(
	({pickup}, res, req) => {
		const test = pickup("test");
		type testType = AssertType<string, typeof test>;

		return {
			test: 1
		};
	},
	["test"]
)
.cut(
	({pickup}, res, req) => {
		const test = pickup("test");
		type testType = AssertType<typeof test, number>;

		if(!true){
			return {};
		}
		return {
			test: ""
		};
	},
	["test"]
)
.handler(({pickup}) => {
	const test = pickup("test");

	type testType = AssertType<typeof test, undefined | string>;
})
.build();
