import {ZodType} from "zod";
import {ProcessExtractObj} from "./process";
import {RouteExtractObj} from "./route";

export type PromiseOrNot<T> = T | Promise<T>;

export type FlatExtract<T extends RouteExtractObj | ProcessExtractObj> = {
	[Property in keyof Flatten<T>]: Flatten<T>[Property] extends ZodType<infer X> ? X : never
};

export type Flatten<T extends {}> = FromPaths<ToPaths<T>>;

type ToPaths<T, P extends string = ""> = T extends Record<number, unknown>
    ? {
        [K in keyof T]: ToPaths<T[K], `${K & string}`>
    }[keyof T]
    : { 
        path: P extends `${infer P}` ? P : never; 
        type: T 
    }

type FromPaths<T extends { path: string; type: unknown }> = {
    [P in T["path"]]: Extract<T, { path: P }>["type"]
}

export type AnyFunction = (...args: any) => any;

export type StepChecker = {
	type: "checker",
	name: string,
	handler: AnyFunction,
	options?: Record<string, any>,
	input: AnyFunction,
	validate: AnyFunction,
	catch: AnyFunction,
	output?: AnyFunction,
	skip?: AnyFunction,
}

export type StepProcess = {
	type: "process",
	name: string,
	options?: Record<string, any>,
	input?: AnyFunction,
	processFunction: AnyFunction,
	pickup?: string[],
	extracted: ProcessExtractObj,
	skip?: AnyFunction,
}

export type StepCut = {
	type: "cut",
	cutFunction: AnyFunction,
}

export type StepCustom = {
	type: "custom",
	customFunction: AnyFunction,
}

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
