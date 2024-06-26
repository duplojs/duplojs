import {parentPort} from "worker_threads";
import {DuploConfig, DuploInstance, ExtractObject, Request, Response, zod} from "../../../scripts";
import {AssertType} from "../index.d";
import {IsOdd} from "../checker/checker";

export const IsAdmin = (duplo: DuploInstance<DuploConfig>) => {
	const isOdd = IsOdd(duplo);
	const hasRight = HasRight(duplo);

	return duplo.createProcess("isAdmin")
	.options({
		testOption1: "test1",
		testOption2: "test2",
	})
	.input(() => 22)
	.extract({
		headers: {
			admin: zod.literal("true"),
		},
		query: {
			number: zod.coerce.number().default(2),
		}
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
			},
		};
	}, ["pick"])
	.build(["pick"]);
};

export const IsManager = (duplo: DuploInstance<DuploConfig>) => {
	const isOdd = IsOdd(duplo);
	const hasRight = HasRight(duplo);

	return duplo.createProcess("isManager")
	.options({
		testOption1: "test1",
		testOption2: "test2",
	})
	.input(() => 22)
	.extract({
		query: {
			skip: zod.literal("true").optional()
		}
	})
	.check(
		isOdd,
		{
			input: p => p("input"),
			result: "odd",
			catch: (res, i) => res.info(i).code(400).send("wrong"),
			indexing: "result",
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

	return duplo.createProcess("isCustomer")
	.input(() => 22)
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

	return duplo.createProcess("isOwner")
	.options({
		option1: 23,
	})
	.cut(({pickup: p}) => {
		parentPort?.postMessage("process options " + p("options").option1);

		return {};
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

	return duplo.createProcess("isUser")
	.options({
		option1: 40,
	})
	.cut(({pickup: p}) => {
		parentPort?.postMessage("process options " + p("options").option1);

		return {};
	})
	.process(
		hasRight,
		{
			options: p => ({
				option2: p("options").option1 + 5
			}),
		}
	)
	.check(
		isOdd,
		{
			input: p => 2,
			result: ["odd"],
			catch: (res, i) => res.info(i).code(400).send("wrong"),
			indexing: "result",
			options: p => ({
				result: p("options").option1
			}),
		}
	)
	.cut(({pickup: p}) => {
		parentPort?.postMessage("checker result " + p("result"));
		const result = p("result");
		type testType = AssertType<typeof result, number>;
		return {};
	})
	.build();
};

export const HasRight = (duplo: DuploInstance<DuploConfig>) => 
	duplo
	.createProcess("hasRight")
	.options({
		option1: 1,
		option2: 2,
	})
	.input(() => 30)
	.cut(
		({pickup: p}) => {
			parentPort?.postMessage("process options1 " + p("options").option1);
			parentPort?.postMessage("process options2 " + p("options").option2);
			parentPort?.postMessage("process input " + p("input"));
			const options = p("options");
			type testType = AssertType<typeof options, {option1: number, option2: number}>;
			const input = p("input");
			type testType1 = AssertType<typeof input, number>;

			return {
				right: true,
			};
		}, 
		["right"]
	)
	.build(["right"]);

export const processTestType = (duplo: DuploInstance<DuploConfig>) => duplo.createProcess<
	{test: any} & Request, 
	{test: any} & Response, 
	{test: any} & ExtractObject
>("abstract10")
.extract({
	test: {}
})
.cut(({}, res, req) => {
	res.test;
	req.test;

	return {};
})
.build([]);

export const testTypeProcess = (duplo: DuploInstance<DuploConfig>) => duplo.createProcess("testTypeProcess")
.extract({
	body: {
		test: zod.string()
	}
})
.cut(() => ({}), [])
.cut(() => ({}))
.cut(
	({pickup}, res, req) => {
		const test = pickup("test");
		type testType = AssertType<string, typeof test>;

		if(!true){
			return {};
		}
		return {
			test: 1
		};
	},
	["test"]
)
.cut(
	({pickup}, res, req) => {
		const test = pickup("test");
		type testType = AssertType<typeof test, undefined | number>;

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
