import {ZodType} from "zod";
import {ProcessCheckerParams, ProcessExtractObj, ProcessProcessParams, Processes} from "./process";
import {RouteCheckerParams, RouteExtractObj, RouteProcessParams, RoutesObject} from "./route";
import {AbstractRouteCheckerParams, AbstractRoutes} from "./abstractRoute";
import {Checkers} from "./checker";

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
        path: P, 
        type: T,
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
	catch: AnyFunction,
	skip?: AnyFunction,
	result?: string | string[],
	indexing?: string,
	params: (
		RouteCheckerParams<any, any, any, any, any>  | 
		ProcessCheckerParams<any, any, any, any, any> | 
		AbstractRouteCheckerParams<any, any, any, any, any>
	) & {skip?: AnyFunction},
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
	params: (
		RouteProcessParams<any, any, any> | 
		ProcessProcessParams<any, any, any>
	) & {skip?: AnyFunction},
	build: () => void,
}

export type StepCut = {
	type: "cut",
	cutFunction: AnyFunction,
	drop: string[],
}

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

export interface DescriptionAbstract{
	type: "abstract",
	descStep: any[],
}

export interface DescriptionFirst{
	type: "first",
	descStep: any[],
}

export interface DescriptionExtracted{
	type: "extracted",
	descStep: any[],
}

export interface DescriptionStep{
	type: "checker" | "process" | "cut",
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

export type DescriptionAll = DescriptionFirst | DescriptionExtracted | DescriptionStep | DescriptionHandler | DescriptionBuild | DescriptionAbstract;

export const deepFreeze = (object: Record<any, any>, deep: number = Infinity): void => {
	deep === 0 ||
	Object.values(Object.freeze(object)).forEach(
		object => 
			typeof object !== "object" ||
			object === null || 
			deepFreeze(object, deep - 1)
	);
};

export const rebuildRoutes = (routes: RoutesObject) => {
	Object.values(routes).forEach(m => 
		Object.values(m).forEach(r => 
			r.build()
		)
	);
};

export const rebuildAbstractRoutes = (abstractRoutes: AbstractRoutes) => {
	Object.values(abstractRoutes).forEach(m => m.build());
};

export const rebuildProcesses = (processes: Processes) => {
	Object.values(processes).forEach(m => m.build());
};

export function deleteDescriptions(
	routes: RoutesObject,
	checkers: Checkers,
	processes: Processes,
	abstractRoutes: AbstractRoutes,
){
	Object.values(routes).forEach(
		method => Object.values(method).forEach(
			route => route.descs = []
		)
	);

	Object.values(checkers).forEach(
		checker => checker.desc = []
	);

	Object.values(processes).forEach(
		process => process.descs = []
	);

	Object.values(abstractRoutes).forEach(
		abstractRoute => abstractRoute.descs = []
	);
}
