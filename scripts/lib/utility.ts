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
