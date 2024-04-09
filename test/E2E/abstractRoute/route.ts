import Duplo, {zod} from "../../../scripts/index";
import {parentPort} from "worker_threads";
import {AssertType} from "../index.d";
import {Abstract1, Abstract2, Abstract3, Abstract6, Abstract10} from "./abstractRoute";

const duplo = Duplo({
	port: 1506, 
	host: "localhost", 
	environment: "DEV"
});

const abstract1 = Abstract1(duplo);
const abstract2 = Abstract2(duplo);
const abstract3 = Abstract3(duplo);
const abstract6 = Abstract6(duplo);
const abstract10 = Abstract10(duplo);

abstract1({pickup: ["number", "result", "right"]})
.declareRoute("GET", "/abstract/test/1")
.handler(({pickup: p}, res) => {
	const number = p("number");
	const result = p("result");
	const right = p("right");

	parentPort?.postMessage("abstract pickup number " + p("number"));
	parentPort?.postMessage("abstract pickup result " + p("result"));
	parentPort?.postMessage("abstract pickup right " + p("right"));

	type testType = AssertType<typeof number, number>;
	type testType1 = AssertType<typeof result, number>;
	type testType2 = AssertType<typeof right, boolean>;

	res.code(204).info("result").send();
});

abstract2({options: {test1: 100}})
.declareRoute("GET", "/abstract/test/2")
.handler(({}, res) => res.code(204).info("result").send());

abstract3()
.declareRoute("GET", "/abstract/test/3")
.handler(({}, res) => res.code(204).info("result").send());

abstract6()
.declareRoute("GET", "/abstract/test/6")
.handler(({}, res) => res.code(204).info("result").send());

abstract10()
.declareRoute("GET", [])
.extract({
	test: {}
})
.cut(({}, res, req) => {
	res.test;
	req.test;

	return {};
})
.handler(() => {});

duplo.launch(() => parentPort?.postMessage("ready"));
