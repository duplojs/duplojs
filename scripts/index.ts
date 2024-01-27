import Duplo from "./lib/main.ts";
import {z as zod} from "zod";

export type * from "./lib/duploInstance.ts";
export type * from "./lib/system/checker.ts";
export {Hook} from "./lib/hook.ts";
export type * from "./lib/system/process.ts";
export {Request} from "./lib/request.ts";
export {Response} from "./lib/response.ts";
export type * from "./lib/builder/route.ts";
export type * from "./lib/utile.ts";
export * from "./lib/duplose/index.ts";
export * from "./lib/duplose/checker.ts";
export * from "./lib/duplose/process.ts";
export * from "./lib/duplose/route.ts";
export * from "./lib/duplose/abstractRoute/index.ts";
export * from "./lib/duplose/abstractRoute/instance.ts";
export * from "./lib/duplose/abstractRoute/merge.ts";
export * from "./lib/duplose/abstractRoute/sub.ts";
export * from "./lib/duploInstance.ts";
export * from "./lib/step";
export * from "./lib/step/checker.ts";
export * from "./lib/step/cut.ts";
export * from "./lib/step/process.ts";


export default Duplo;
export {
	Duplo,
	zod,
};
