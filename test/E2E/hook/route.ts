import Duplo from "../../../scripts/index";
import {parentPort} from "worker_threads";

const duplo = Duplo({
	port: 1506, 
	host: "localhost", 
	environment: "DEV"
});

duplo
.addHook("onConstructRequest", () => {parentPort?.postMessage("global onConstructRequest");})
.addHook("onConstructResponse", () => {parentPort?.postMessage("global onConstructResponse");})
.addHook("beforeRouteExecution", () => {parentPort?.postMessage("global beforeRouteExecution");})
.addHook("parsingBody", () => {parentPort?.postMessage("global parsingBody");})
.addHook("beforeSend", () => {parentPort?.postMessage("global beforeSend");})
.addHook("afterSend", () => {parentPort?.postMessage("global afterSend");})
.addHook("onError", () => {parentPort?.postMessage("global onError");});

const deepProcess1 = duplo.createProcess("deepProcess1")
.hook("onConstructRequest", () => {parentPort?.postMessage("deepProcess onConstructRequest");})
.hook("onConstructResponse", () => {parentPort?.postMessage("deepProcess onConstructResponse");})
.hook("beforeRouteExecution", () => {parentPort?.postMessage("deepProcess beforeRouteExecution");})
.hook("parsingBody", () => {parentPort?.postMessage("deepProcess parsingBody");})
.hook("beforeSend", () => {parentPort?.postMessage("deepProcess beforeSend");})
.hook("afterSend", () => {parentPort?.postMessage("deepProcess afterSend");})
.hook("onError", () => {parentPort?.postMessage("deepProcess onError");})
.build();

const process1 = duplo.createProcess("process1")
.hook("onConstructRequest", () => {parentPort?.postMessage("process onConstructRequest");})
.hook("onConstructResponse", () => {parentPort?.postMessage("process onConstructResponse");})
.hook("beforeRouteExecution", () => {parentPort?.postMessage("process beforeRouteExecution");})
.hook("parsingBody", () => {parentPort?.postMessage("process parsingBody");})
.hook("beforeSend", () => {parentPort?.postMessage("process beforeSend");})
.hook("afterSend", () => {parentPort?.postMessage("process afterSend");})
.hook("onError", () => {parentPort?.postMessage("process onError");})
.process(deepProcess1)
.build();

const deepAbstractRoute1 = duplo.declareAbstractRoute("deepAbstractRoute1")
.hook("onConstructRequest", () => {parentPort?.postMessage("deepAbstract onConstructRequest");})
.hook("onConstructResponse", () => {parentPort?.postMessage("deepAbstract onConstructResponse");})
.hook("beforeRouteExecution", () => {parentPort?.postMessage("deepAbstract beforeRouteExecution");})
.hook("parsingBody", () => {parentPort?.postMessage("deepAbstract parsingBody");})
.hook("beforeSend", () => {parentPort?.postMessage("deepAbstract beforeSend");})
.hook("afterSend", () => {parentPort?.postMessage("deepAbstract afterSend");})
.hook("onError", () => {parentPort?.postMessage("deepAbstract onError");})
.process(process1)
.build();

const abstractRoute1 = deepAbstractRoute1()
.declareAbstractRoute("abstractRoute1")
.hook("onConstructRequest", () => {parentPort?.postMessage("abstract onConstructRequest");})
.hook("onConstructResponse", () => {parentPort?.postMessage("abstract onConstructResponse");})
.hook("beforeRouteExecution", () => {parentPort?.postMessage("abstract beforeRouteExecution");})
.hook("parsingBody", () => {parentPort?.postMessage("abstract parsingBody");})
.hook("beforeSend", () => {parentPort?.postMessage("abstract beforeSend");})
.hook("afterSend", () => {parentPort?.postMessage("abstract afterSend");})
.hook("onError", () => {parentPort?.postMessage("abstract onError");})
.build();

const mergeAbstractRoute1 = duplo.mergeAbstractRoute([abstractRoute1()]);

mergeAbstractRoute1
.declareRoute("GET", "/hook/test/1")
.hook("onConstructRequest", () => {parentPort?.postMessage("local onConstructRequest");})
.hook("onConstructResponse", () => {parentPort?.postMessage("local onConstructResponse");})
.hook("beforeRouteExecution", () => {parentPort?.postMessage("local beforeRouteExecution");})
.hook("parsingBody", () => {parentPort?.postMessage("local parsingBody");})
.hook("beforeSend", () => {parentPort?.postMessage("local beforeSend");})
.hook("afterSend", () => {parentPort?.postMessage("local afterSend");})
.hook("onError", () => {parentPort?.postMessage("local onError");})
.extract({body: {}})
.process(process1)
.handler(({}, res) => {throw new Error("fake error");});

duplo.addHook("beforeBuildRouter", () => {
	parentPort?.postMessage("beforeBuildRouter");
});

duplo.addHook("afterBuildRouter", () => {
	parentPort?.postMessage("afterBuildRouter");
});

duplo.addHook("beforeListenHttpServer", () => {
	parentPort?.postMessage("beforeListenHttpServer");
});

duplo.addHook("onReady", () => {
	parentPort?.postMessage("onReady");
});

duplo.launch(() => parentPort?.postMessage("ready"));
