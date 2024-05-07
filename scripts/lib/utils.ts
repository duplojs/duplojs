import {ZodType, infer as zodInfer} from "zod";
import {Checkers} from "./system/checker";
import {ExtractObject} from "./duplose";
import {Routes} from "./system/route";
import {AbstractRoutes} from "./system/abstractRoute";
import {Processes} from "./system/process";

export type PromiseOrNot<T> = T | Promise<T>;

type FlatPath = {
    path: string;
    type: unknown;
}

type ToPaths<T extends ExtractObject> = {
    [K in keyof T]: T[K] extends ZodType 
		? {
			path: K;
			type: zodInfer<T[K]>;
		}
		: {
			[P in keyof T[K]]: T[K][P] extends ZodType
				? {
					path: P;
					type: zodInfer<T[K][P]>;
				}
				: never
		}[keyof T[K]];
}[keyof T];

type FromPaths<T extends FlatPath> = {
    [P in T as P["path"]]: P["type"];
};

export type FlatExtract<
	T extends ExtractObject, 
	flatPath = ToPaths<T>
> = FromPaths<flatPath extends FlatPath ? flatPath : never>;

export type AnyFunction = (...args: any) => any;

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

export interface DescriptionDrop{
	type: "drop",
	descStep: any[],
}

export interface DescriptionOptions{
	type: "options",
	descStep: any[],
}

export interface DescriptionInput{
	type: "input",
	descStep: any[],
}

export interface DescriptionPrecompletion{
	type: "precompletion",
	descStep: any[],
}

export type DescriptionAll = 
	DescriptionFirst 
	| DescriptionExtracted 
	| DescriptionStep 
	| DescriptionHandler 
	| DescriptionDrop 
	| DescriptionAbstract 
	| DescriptionOptions 
	| DescriptionInput
	| DescriptionPrecompletion;

export function buildDuplose(
	routes: Routes,
	processes: Processes,
	abstractRoutes: AbstractRoutes,
){
	processes.forEach(m => m.build());
	abstractRoutes.forEach(m => m.build());
	Object.values(routes).forEach(
		routes => routes.forEach(
			route => route.build()
		)
	);
}

export function deleteDescriptions(
	routes: Routes,
	checkers: Checkers,
	processes: Processes,
	abstractRoutes: AbstractRoutes,
){
	Object.values(routes).forEach(
		routes => routes.forEach(
			route => route.descs = []
		)
	);
	Object.values(checkers).forEach(
		checker => checker.descs = []
	);
	processes.forEach(process => process.descs = []);
	abstractRoutes.forEach(abstractRoute => abstractRoute.descs = []);
}

export function deleteEditingDuploseFunctions(
	routes: Routes,
	processes: Processes,
	abstractRoutes: AbstractRoutes,
){
	Object.values(routes).forEach(
		routes => routes.forEach(
			route => route.editingDuploseFunctions = []
		)
	);
	Object.values(processes).forEach(
		process => process.editingDuploseFunctions = []
	);
	Object.values(abstractRoutes).forEach(
		abstractRoute => abstractRoute.editingDuploseFunctions = []
	);
}

export function correctPath(path: string){
	if(path[0] !== "/") path = "/" + path;
	path = path.endsWith("/") ? path.slice(0, -1) : path;
	return path;
}

export interface Floor<
	floorValues extends {}, 
	floorKeys extends Exclude<keyof floorValues, number | symbol> = Exclude<keyof floorValues, number | symbol>
>{
	pickup<key extends floorKeys>(index: key): floorValues[key];
	drop<key extends floorKeys>(index: key, value: floorValues[key]): void;
}

export type FixedFloor<floorObject extends Floor<any>> = {
	fix: {
		pickup: floorObject["pickup"],
		drop: floorObject["pickup"],
	}
}

export function makeFloor(): Floor<{}>
{
	const floorValues: Record<string, any> = new Map();

	return {
		pickup: (index) => floorValues.get(index),
		drop: (index, value) => {floorValues.set(index, value);}
	};
}

declare global {
	interface ObjectConstructor {
		hasProp<anyObject extends object>(o: anyObject, key: symbol | number | string): key is keyof anyObject;
		entries<
			anyObject extends object, 
			anyKey extends Exclude<keyof anyObject, symbol> = Exclude<keyof anyObject, symbol>
		>(o: anyObject): Array<
			Exclude<
				{
					[p in anyKey]: [`${p}`, anyObject[p]] 
				}[anyKey],
				undefined
			>
		>;
		keys<
			anyObject extends object,
			anyKey extends Exclude<keyof anyObject, symbol> = Exclude<keyof anyObject, symbol>
		>(o: anyObject): (`${anyKey}`)[];
	}
}

//@ts-ignore
Object.hasProp = (o, key) => key in o;

export const pathToStringRegExp = (path: string) => `/^${path.replace(/\//g, "\\/").replace(/\.?\*/g, ".*")}\\/?(?:\\?[^]*)?$/`.replace(
	/\{([a-zA-Z0-9_\-]+)\}/g,
	(match, group1) => `(?<${group1}>[a-zA-Z0-9_\\-]+)`
);
