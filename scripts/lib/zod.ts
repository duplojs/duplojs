import {z, ZodEffects, ZodString, ZodType, ZodTypeAny, ZodTypeDef} from "zod";

declare module "zod" {
	interface ZodString {
		containBool: typeof containBool;
	}
}

//@ts-ignore
const containBool: ZodType<boolean> = z
.union([
	z.literal("true"), 
	z.literal("false")
])
.transform((value) => value === "true" ? true : false);

ZodString.prototype.containBool = containBool;

export {z as zod};
