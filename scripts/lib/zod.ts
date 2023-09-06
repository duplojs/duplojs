import {z, ZodString} from "zod";

declare module "zod" {
	interface ZodString {
		containBool: typeof containBool
	}
}

const containBool = z.union([z.literal("true"), z.literal("false")]).transform((value) => value === "true" ? true : false);

ZodString.prototype.containBool = containBool;

export {z as zod};
