import Duplo from "./lib/main.ts";
import {z as zod} from "zod";

//types
export type * from "./lib/abstractRoute.ts";
export type * from "./lib/checker.ts";
export type * from "./lib/contentTypeParser.ts";
export type * from "./lib/floor.ts";
export type * from "./lib/hook.ts";
export type * from "./lib/main.ts";
export type * from "./lib/process.ts";
export {Request} from "./lib/request.ts";
export {Response, SentError} from "./lib/response.ts";
export type * from "./lib/route.ts";
export type * from "./lib/utility.ts";

export default Duplo;
export {
	Duplo,
	zod,
};
