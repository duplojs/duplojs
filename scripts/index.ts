import {z as zod} from "zod";
import Duplo from "./lib/main.ts";
export default Duplo;
export {
	Duplo,
	zod,
};
export * from "./lib/duploInstance.ts";
export * from "./lib/hook.ts";
export * from "./lib/request.ts";
export * from "./lib/response.ts";
export * from "./lib/utile.ts";

//duplose
export * from "./lib/duplose/index.ts";
export * from "./lib/duplose/checker.ts";
export * from "./lib/duplose/process.ts";
export * from "./lib/duplose/route.ts";
export * from "./lib/duplose/abstractRoute/index.ts";
export * from "./lib/duplose/abstractRoute/instance.ts";
export * from "./lib/duplose/abstractRoute/merge.ts";
export * from "./lib/duplose/abstractRoute/sub.ts";
export * from "./lib/duploInstance.ts";

//step
export * from "./lib/step";
export * from "./lib/step/checker.ts";
export * from "./lib/step/cut.ts";
export * from "./lib/step/process.ts";

//system
export * from "./lib/system/process.ts";
export * from "./lib/system/checker.ts";
export * from "./lib/system/abstractRoute.ts";
export * from "./lib/system/route.ts";
export * from "./lib/system/router.ts";

//builder
export * from "./lib/builder/route.ts";
export * from "./lib/builder/abstractRoute.ts";
export * from "./lib/builder/mergeAbstractRoute.ts";
export * from "./lib/builder/checker.ts";
export * from "./lib/builder/process.ts";

//error
export * from "./lib/error/alreadySent.ts";
export * from "./lib/error/notError.ts";
export * from "./lib/error/outOfContextResponse.ts";
export * from "./lib/error/uncaughtResponse.ts";
