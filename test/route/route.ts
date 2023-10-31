import Duplo, {zod} from "../../scripts/index";
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

duplo.declareRoute("POST", "/test/4")
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

duplo.launch(() => parentPort?.postMessage("ready"));
