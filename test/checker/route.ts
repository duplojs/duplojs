import Duplo, {zod} from "../../scripts/index";
import {parentPort} from "worker_threads";
import {IsOdd} from "./checker";

const duplo = Duplo({port: 1506, host: "localhost"});

const isOdd = IsOdd(duplo);

duplo.declareRoute("GET", "/checker/test/1")
.extract({
	query: {
		number: zod.coerce.number(),
		skip: zod.literal("true").optional(),
	}
})
.check<typeof isOdd, "result", "odd">(
	isOdd,
	{
		input: p => p("number"),
		validate: i => i === "odd",
		catch: (res, i) => res.info(i).code(400).send("wrong"),
		output: (d, i, da) => d("result", da),
		skip: p => p("skip") === "true",
	}
)
.cut(({pickup: p}, res) => {
	if(p("skip") === "true" && p("result") === undefined){
		parentPort?.postMessage("skip test");
		res.info("skipTest").code(204).send();
	}
})
.handler(({pickup: p}, res) => res.info("odd").code(200).send(p("result")));

duplo.declareRoute("GET", "/checker/test/2")
.custom(() => parentPort?.postMessage("custom step"))
.check<typeof isOdd, "result", "odd">(
	isOdd,
	{
		input: p => 2,
		validate: i => i === "odd",
		catch: (res, i) => res.info(i).code(400).send("wrong"),
		output: (d, i, da) => d("result", da),
		options: {
			result: 55,
		}
	}
)
.handler(({pickup: p}, res) => res.info("odd").code(200).send(p("result")));

duplo.declareRoute("GET", "/checker/test/3")
.extract({
	query: {
		number: zod.coerce.number(),
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
			result: p("number"),
		})
	}
)
.handler(({pickup: p}, res) => res.info("odd").code(200).send(p("result")));

duplo.launch(() => parentPort?.postMessage("ready"));
