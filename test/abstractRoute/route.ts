import Duplo, {zod} from "../../scripts/index";
import {parentPort} from "worker_threads";
import {Abstract1, Abstract2, Abstract3, Abstract4, Abstract5, Abstract6, Abstract7, Abstract8} from "./abstractRoute";

const duplo = Duplo({port: 1506, host: "localhost"});

const abstract1 = Abstract1(duplo);
const abstract2 = Abstract2(duplo);
const abstract3 = Abstract3(duplo);
const abstract4 = Abstract4(duplo);
const abstract5 = Abstract5(duplo);
const abstract6 = Abstract6(duplo);
const abstract7 = Abstract7(duplo);
const abstract8 = Abstract8(duplo);

abstract1({pickup: ["number", "result", "right"]})
.declareRoute("GET", "/abstract/test/1")
.handler(({pickup: p}, res) => {
	parentPort?.postMessage("abstract pickup number " + p("number"));
	parentPort?.postMessage("abstract pickup result " + p("result"));
	parentPort?.postMessage("abstract pickup right " + p("right"));

	res.code(204).info("result").send();
});

abstract2({options: {test1: 100}})
.declareRoute("GET", "/abstract/test/2")
.handler(({}, res) => res.code(204).info("result").send());

abstract3()
.declareRoute("GET", "/abstract/test/3")
.handler(({}, res) => res.code(204).info("result").send());

abstract4({ignorePrefix: true})
.declareRoute("GET", "/abstract/test/4")
.handler(({}, res) => res.code(204).info("result").send());

abstract4()
.declareRoute("GET", "/abstract/test/4")
.handler(({}, res) => res.code(200).info("result").send());

abstract5()
.declareRoute("GET", "/abstract/test/5")
.handler(({}, res) => res.code(204).info("result").send());

abstract6()
.declareRoute("GET", "/abstract/test/6")
.handler(({}, res) => res.code(204).info("result").send());

abstract7()
.declareRoute("GET", "/abstract/test/7")
.handler(({}, res) => res.code(204).info("result").send());

abstract8()
.declareRoute("GET", "/abstract/test/8")
.handler(({}, res) => res.code(204).info("result").send());

duplo.launch(() => parentPort?.postMessage("ready"));
