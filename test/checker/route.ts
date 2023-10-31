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
.check(
	isOdd,
	{
		input: p => p("number"),
		result: "odd",
		catch: (res, i) => res.info(i).code(400).send("wrong"),
		indexing: "result",
		skip: p => p("skip") === "true",
	}
)
.cut(({pickup: p}, res) => {
	if(p("result") === undefined){
		parentPort?.postMessage("skip test");
		res.info("skipTest").code(204).send();
	}
})
.handler(({pickup: p}, res) => res.info("odd").code(200).send(p("result")));

duplo.declareRoute("GET", "/checker/test/2")
.check(
	isOdd,
	{
		input: p => 2,
		result: "odd",
		catch: (res, i) => res.info(i).code(400).send("wrong"),
		indexing: "result",
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
.check(
	isOdd,
	{
		input: p => 2,
		result: "odd",
		catch: (res, i) => res.info(i).code(400).send("wrong"),
		indexing: "result",
		options: p => ({
			result: p("number"),
		})
	}
)
.handler(({pickup: p}, res) => res.info("odd").code(200).send(p("result")));

duplo.launch(() => parentPort?.postMessage("ready"));
