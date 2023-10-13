import {ZodType} from "zod";
import {ProcessCheckerParams, ProcessExport, ProcessExtractObj, ProcessProcessParams} from "./process";
import {RouteCheckerParams, RouteExtractObj, RouteProcessAccessParams, RouteProcessParams} from "./route";
import {AbstractRouteCheckerParams} from "./abstractRoute";

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
	params: RouteCheckerParams<any, any, any, any> | 
		ProcessCheckerParams<any, any, any, any> | 
		AbstractRouteCheckerParams<any, any, any, any>,
	build: () => void,
}

export type StepProcess = {
	type: "process",
	name: string,
	options?: Record<string, any>,
	input?: AnyFunction,
	processFunction: AnyFunction,
	pickup?: string[],
	skip?: AnyFunction,
	params: RouteProcessParams<any, any, any> | ProcessProcessParams<any, any, any>,
	build: () => void,
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

export interface DescriptionFirst{
	type: "first",
	descStep: any[],
}

export interface DescriptionAccess{
	type: "access",
	isShort: boolean,
	descStep: any[],
}

export interface DescriptionExtracted{
	type: "extracted",
	descStep: any[],
}

export interface DescriptionStep{
	type: "checker" | "process" | "cut" | "custom",
	index: number,
	descStep: any[],
}

export interface DescriptionHandler{
	type: "handler",
	descStep: any[],
}

export interface DescriptionBuild{
	type: "build",
	descStep: any[],
}

export type DescriptionAll = DescriptionFirst | DescriptionAccess | DescriptionExtracted | DescriptionStep | DescriptionHandler | DescriptionBuild
