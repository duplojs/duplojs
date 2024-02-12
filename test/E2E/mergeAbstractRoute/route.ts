import Duplo, {zod} from "../../../scripts/index";
import {parentPort} from "worker_threads";
import {MergeAbstractRoute1, MergeAbstractRoute2, MergeAbstractRoute3} from "./mergeAbstractRoute";

const duplo = Duplo({
	port: 1506, 
	host: "localhost", 
	environment: "DEV"
});

const mergeAbstractRoute1 = MergeAbstractRoute1(duplo);
const mergeAbstractRoute2 = MergeAbstractRoute2(duplo);
const mergeAbstractRoute3 = MergeAbstractRoute3(duplo);

mergeAbstractRoute1.declareRoute("GET", "/mergeAbstract/test/1")
.handler(({pickup: p}, res) => {
	parentPort?.postMessage("mergeAbstract pickup test " + p("test"));
	parentPort?.postMessage("mergeAbstract pickup yyy " + p("yyy"));
	res.code(204).info("result").send();
});

mergeAbstractRoute2.declareRoute("GET", "/mergeAbstract/test/2")
.handler(({}, res) => res.code(204).info("result").send());

mergeAbstractRoute3.declareRoute("GET", [])
.extract({
	test: zod.string(),
	test1: zod.number(),
})
.cut(({pickup}, res, req) => {
	res.test().test1();
	req.test().test1();

	pickup("test");
	pickup("test1");
})
.handler(() => {});

duplo.launch(() => parentPort?.postMessage("ready"));
