import {methods, Request} from "../request";
import {Floor} from "../floor";
import {__exec__, Response} from "../response";
import {AddHooksLifeCycle, ServerHooksLifeCycle} from "../hook";
import {PickupDropProcess} from "../builder/process";
import {AbstractRoute} from "../abstractRoute";
import {AnyFunction, FlatExtract} from "../utility";
import {ErrorExtractFunction, Route as DefaultRoute, RouteExtractObj, RoutehandlerFunction, ExtendsRoute} from "../duplose/route";
import {Process} from "../duplose/process";
import {Routes} from "../system/route";
import {Checker, CheckerGetParmas} from "../duplose/checker";
import {CheckerParamsStep, CheckerStep} from "../step/checker";
import {CutFunction, ProcessParamsStep, ProcessStep} from "../step/process";
import {CutStep} from "../step/cut";

export type DeclareRoute<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends RouteExtractObj = RouteExtractObj,
	floor extends {} = {},
> = (
	method: methods, 
	path: string | string[], 
	abstractRoute?: AbstractRoute, 
	...desc: any[]
) => BuilderPatternRoute<request, response, extractObj, floor>;

export type RouteStepParamsSkip<floor extends {}> = (pickup: Floor<floor>["pickup"]) => boolean;

export interface BuilderPatternRoute<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends RouteExtractObj = RouteExtractObj,
	floor extends {} = {},
>{
	hook: AddHooksLifeCycle<BuilderPatternRoute<request, response, extractObj, floor>, request, response>["addHook"];

	extract<
		localeExtractObj extends extractObj,
		localFloor extends FlatExtract<localeExtractObj>
	>(
		extractObj: localeExtractObj, 
		error?: ErrorExtractFunction<response>,
		...desc: any[]
	): Omit<BuilderPatternRoute<request, response, extractObj, floor & localFloor>, "hook" | "extract">;

	check<
		checker extends Checker,
		info extends string,
		skipObj extends {skip?: RouteStepParamsSkip<floor>;},
		index extends string = never,
		checkerParams extends CheckerGetParmas<checker> = CheckerGetParmas<checker>
	>(
		checker: checker, 
		params: CheckerParamsStep<checker, response, floor, info, index> & skipObj,
		...desc: any[]
	): Omit<
		BuilderPatternRoute<
			request, 
			response, 
			extractObj, 
			floor & {
				[Property in index]: skipObj["skip"] extends AnyFunction ? 
					Extract<checkerParams["output"], {info: info}>["data"] | undefined : 
					Extract<checkerParams["output"], {info: info}>["data"]
			}
		>, 
		"hook" | "extract"
	>;

	process<
		process extends Process,
		pickup extends string,
		skipObj extends {skip?: RouteStepParamsSkip<floor>;},
	>(
		process: process, 
		params?: ProcessParamsStep<process, pickup, floor> & skipObj,
		...desc: any[]
	): Omit<
		BuilderPatternRoute<
			request, 
			response, 
			extractObj, 
			floor & (
				skipObj["skip"] extends AnyFunction ? 
					Partial<PickupDropProcess<process, pickup>> :
					PickupDropProcess<process, pickup>
			)
		>, 
		"hook" | "extract"
	>;

	cut<localFloor extends {}, drop extends keyof localFloor>(
		short: CutFunction<request, response, localFloor, floor>,
		drop?: drop[] & Extract<keyof localFloor, string>[],
		...desc: any[]
	): Omit<
		BuilderPatternRoute<
			request, 
			response, 
			extractObj, 
			floor & Pick<localFloor, drop extends keyof localFloor ? drop : never>
		>, 
		"hook" | "extract"
	>;

	handler(handlerFunction: RoutehandlerFunction<response, floor>, ...desc: any[]): DefaultRoute;
}

export function makeRouteBuilder(
	serverHooksLifeCycle: ServerHooksLifeCycle,
	Route: typeof ExtendsRoute,
	routes: Routes
){
	const declareRoute: DeclareRoute = (method, paths, abstractRoute, ...desc) => {
		const currentRoute = new Route(
			method, 
			paths instanceof Array ? paths : [paths], 
			abstractRoute
		);
		if(abstractRoute)currentRoute.descs.push(...abstractRoute.descs);
		if(desc.length !== 0)currentRoute.descs.push({type: "first", descStep: desc});

		const hook: BuilderPatternRoute["hook"] = (name, hookFunction: AnyFunction) => {
			currentRoute.hooksLifeCyle[name].addSubscriber(hookFunction);

			return {
				hook,
				extract,
				handler,
				check,
				process,
				cut,
			};
		};

		const extract: BuilderPatternRoute["extract"] = (extractObj, error, ...desc) => {
			currentRoute.setExtract(extractObj, error, desc);
			
			return {
				check,
				handler,
				process,
				cut,
			};
		};

		const process: BuilderPatternRoute<any, any, any, any>["process"] = (_process, params, ...desc) => {
			currentRoute.addStepProcess(
				new ProcessStep(_process, params || {}),
				desc
			);

			return {
				check,
				process,
				handler,
				cut,
			};
		};

		const check: BuilderPatternRoute<any, any, any, any>["check"] = (checker, params, ...desc) => {
			currentRoute.addStepChecker(
				new CheckerStep(checker, params), 
				desc
			);

			return {
				check,
				handler,
				process,
				cut,
			};
		};

		const cut: BuilderPatternRoute<any, any, any, any>["cut"] = (short, drop, ...desc) => {
			currentRoute.addStepCut(
				new CutStep(short, drop || []), 
				desc
			);

			return {
				check,
				handler,
				process,
				cut,
			};
		};

		const handler: BuilderPatternRoute<any, any, any, any>["handler"] = (handlerFunction, ...desc) => {
			currentRoute.setHandler(handlerFunction, desc);

			currentRoute.build();
			routes[currentRoute.method].push(currentRoute);
			serverHooksLifeCycle.onDeclareRoute.syncLaunchSubscriber(currentRoute);

			return currentRoute;
		};

		return {
			hook,
			extract,
			check,
			process,
			cut,
			handler,
		};
	};

	return {
		declareRoute,
		// declareRoute<
		// 	request extends Request = Request, 
		// 	response extends Response = Response,
		// 	extractObj extends RouteExtractObj = RouteExtractObj,
		// >(method: Request["method"], path: string | string[], ...desc: any[]){
		// 	return declareRoute(method, path, undefined, ...desc) as BuilderPatternRoute<request, response, extractObj>;
		// },
	};
}
