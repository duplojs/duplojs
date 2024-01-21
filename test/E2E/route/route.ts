import Duplo, {zod} from "../../../scripts/index";
import {parentPort} from "worker_threads";

const duplo = Duplo({port: 1506, host: "localhost", prefix: "route"});

duplo.setNotfoundHandler((req, res) => {
	parentPort?.postMessage("matched path " + req.matchedPath);
	res.code(404).info("notfound").send();
});

duplo.setErrorHandler((req, res, error) => {
	parentPort?.postMessage("error message " + error.message);
	res.code(500).info("error").send();
});

duplo.declareRoute("GET", "/test/1")
.handler(({}, res) => res.code(200).info("s").send("hello-world"));

duplo.declareRoute("GET", "/test/2/{test}")
.extract({
	params: {
		test: zod.string(),
	}
})
.handler(({pickup}, res) => res.code(200).info(pickup("test")).send());

duplo.declareRoute("GET", "/test/3")
.handler(({}, res) => res.code(200).info("s").send({test: 1}));

const tt = duplo.declareRoute("POST", "/test/4")
.extract({
	body: zod.string(),
})
.handler(({pickup}, res) => res.code(200).info("s").send(pickup("body")));

duplo.declareRoute("PUT", "/test/5")
.extract({
	body: zod.object({test: zod.number()}).strict(),
})
.handler(({pickup}, res) => res.code(200).info("s").send(pickup("body")));

duplo.declareRoute("GET", "/test/6")
.handler(({}, res) => {
	throw new Error("my error");
});

duplo.declareRoute("GET", "/test/7")
.cut(() => ({test: 15}), ["test"])
.handler(({pickup}, res) => {
	res.code(200).info("s").send(pickup("test"));
});

duplo.declareRoute("GET", "/test/8")
.handler(({}, res) => {
	res.code(200).info("s").sendFile(__dirname + "/../../../CONTRIBUTING.md");
});

duplo.declareRoute("GET", "/test/9")
.handler(({}, res) => {
	res.code(200).info("s").sendFile("none");
});

duplo.declareRoute("GET", "/test/10")
.handler(({}, res) => {
	new Promise(res => setTimeout(res, 500)).then(() => res.code(200).info("s").send());
});

duplo.declareRoute("GET", "/test/11")
.hook("onConstructResponse", (res) => res.send())
.handler(({}, res) => {});

duplo.declareRoute("GET", "/test/hook/onConstructRequest")
.hook("onConstructRequest", (res) => parentPort?.postMessage("hook onConstructRequest"))
.handler(({}, res) => {res.code(200).info("s").send();});

duplo.declareRoute("GET", "/test/hook/onConstructResponse")
.hook("onConstructResponse", (res) => parentPort?.postMessage("hook onConstructResponse"))
.handler(({}, res) => {res.code(200).info("s").send();});

duplo.declareRoute("GET", "/test/hook/beforeRouteExecution")
.hook("beforeRouteExecution", (res) => parentPort?.postMessage("hook beforeRouteExecution"))
.handler(({}, res) => {res.code(200).info("s").send();});

duplo.declareRoute("GET", "/test/hook/parsingBody")
.hook("parsingBody", (res) => parentPort?.postMessage("hook parsingBody"))
.extract({body: zod.undefined()})
.handler(({}, res) => {res.code(200).info("s").send();});

duplo.declareRoute("GET", "/test/hook/beforeSend")
.hook("beforeSend", (res) => parentPort?.postMessage("hook beforeSend"))
.handler(({}, res) => {res.code(200).info("s").send();});

duplo.declareRoute("GET", "/test/hook/afterSend")
.hook("afterSend", (res) => parentPort?.postMessage("hook afterSend"))
.handler(({}, res) => {res.code(200).info("s").send();});

duplo.declareRoute("GET", "/test/hook/onError")
.hook("onError", (res) => parentPort?.postMessage("hook onError"))
.handler(({}, res) => {throw new Error("test");});

duplo.setDefaultErrorExtract((res) => res.code(400).send("error extract"));

duplo.declareRoute("GET", "/test/12/{test}")
.extract({
	params: {
		test: zod.coerce.number(),
	}
})
.handler(({}, res) => res.code(200).send());

duplo.launch(() => parentPort?.postMessage("ready"));
