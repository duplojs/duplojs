import Duplo, {zod} from "../../scripts/index";
import {parentPort} from "worker_threads";

const duplo = Duplo({port: 1506, host: "localhost"});

duplo
.addHook("onConstructRequest", () => {parentPort?.postMessage("global onConstructRequest");})
.addHook("onConstructResponse", () => {parentPort?.postMessage("global onConstructResponse");})
.addHook("beforeRouteExecution", () => {parentPort?.postMessage("global beforeRouteExecution");})
.addHook("beforeParsingBody", () => {parentPort?.postMessage("global beforeParsingBody");})
.addHook("beforeSend", () => {parentPort?.postMessage("global beforeSend");})
.addHook("afterSend", () => {parentPort?.postMessage("global afterSend");})
.addHook("onError", () => {parentPort?.postMessage("global onError");});

const deepProcess1 = duplo.createProcess("deepProcess1")
.hook("onConstructRequest", () => {parentPort?.postMessage("deepProcess onConstructRequest");})
.hook("onConstructResponse", () => {parentPort?.postMessage("deepProcess onConstructResponse");})
.hook("beforeRouteExecution", () => {parentPort?.postMessage("deepProcess beforeRouteExecution");})
.hook("beforeParsingBody", () => {parentPort?.postMessage("deepProcess beforeParsingBody");})
.hook("beforeSend", () => {parentPort?.postMessage("deepProcess beforeSend");})
.hook("afterSend", () => {parentPort?.postMessage("deepProcess afterSend");})
.hook("onError", () => {parentPort?.postMessage("deepProcess onError");})
.build();

const process1 = duplo.createProcess("process1")
.hook("onConstructRequest", () => {parentPort?.postMessage("process onConstructRequest");})
.hook("onConstructResponse", () => {parentPort?.postMessage("process onConstructResponse");})
.hook("beforeRouteExecution", () => {parentPort?.postMessage("process beforeRouteExecution");})
.hook("beforeParsingBody", () => {parentPort?.postMessage("process beforeParsingBody");})
.hook("beforeSend", () => {parentPort?.postMessage("process beforeSend");})
.hook("afterSend", () => {parentPort?.postMessage("process afterSend");})
.hook("onError", () => {parentPort?.postMessage("process onError");})
.process(deepProcess1)
.build();

const abstractRoute1 = duplo.declareAbstractRoute("abstractRoute1")
.hook("onConstructRequest", () => {parentPort?.postMessage("abstract onConstructRequest");})
.hook("onConstructResponse", () => {parentPort?.postMessage("abstract onConstructResponse");})
.hook("beforeRouteExecution", () => {parentPort?.postMessage("abstract beforeRouteExecution");})
.hook("beforeParsingBody", () => {parentPort?.postMessage("abstract beforeParsingBody");})
.hook("beforeSend", () => {parentPort?.postMessage("abstract beforeSend");})
.hook("afterSend", () => {parentPort?.postMessage("abstract afterSend");})
.hook("onError", () => {parentPort?.postMessage("abstract onError");})
.process(process1)
.build();

const deepAbstractRoute1 = abstractRoute1()
.declareAbstractRoute("deepAbstractRoute1")
.hook("onConstructRequest", () => {parentPort?.postMessage("deepAbstract onConstructRequest");})
.hook("onConstructResponse", () => {parentPort?.postMessage("deepAbstract onConstructResponse");})
.hook("beforeRouteExecution", () => {parentPort?.postMessage("deepAbstract beforeRouteExecution");})
.hook("beforeParsingBody", () => {parentPort?.postMessage("deepAbstract beforeParsingBody");})
.hook("beforeSend", () => {parentPort?.postMessage("deepAbstract beforeSend");})
.hook("afterSend", () => {parentPort?.postMessage("deepAbstract afterSend");})
.hook("onError", () => {parentPort?.postMessage("deepAbstract onError");})
.build();

const mergeAbstractRoute1 = duplo.mergeAbstractRoute([deepAbstractRoute1()]);

mergeAbstractRoute1
.declareRoute("GET", "/hook/test/1")
.hook("onConstructRequest", () => {parentPort?.postMessage("local onConstructRequest");})
.hook("onConstructResponse", () => {parentPort?.postMessage("local onConstructResponse");})
.hook("beforeRouteExecution", () => {parentPort?.postMessage("local beforeRouteExecution");})
.hook("beforeParsingBody", () => {parentPort?.postMessage("local beforeParsingBody");})
.hook("beforeSend", () => {parentPort?.postMessage("local beforeSend");})
.hook("afterSend", () => {parentPort?.postMessage("local afterSend");})
.hook("onError", () => {parentPort?.postMessage("local onError");})
.extract({body: {}})
.process(process1)
.handler(({}, res) => {throw new Error("fake error");});

duplo.launch(() => parentPort?.postMessage("ready"));
