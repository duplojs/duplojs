import {HttpMethods, Request} from "../request";
import {Response} from "../response";
import {AddHooksLifeCycle, ServerHooksLifeCycle} from "../hook";
import {PickupDropProcess} from "../builder/process";
import {AnyFunction, FlatExtract, Floor} from "../utils";
import {Route as DefaultRoute, ExtendsRoute} from "../duplose/route";
import {Process} from "../duplose/process";
import {Routes} from "../system/route";
import {Checker, CheckerGetParmas} from "../duplose/checker";
import {CheckerParamsStep, CheckerStep} from "../step/checker";
import {ProcessParamsStep, ProcessStep} from "../step/process";
import {CutFunction, CutStep} from "../step/cut";
import {ErrorExtractFunction, ExtractObject, HandlerFunction} from "../duplose";
import {SubAbstractRoute} from "../duplose/abstractRoute/sub";

export type DeclareRoute<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends ExtractObject = ExtractObject,
	floorValues extends {} = {},
> = (
	method: HttpMethods, 
	path: string | string[], 
	subAbstractRoute?: SubAbstractRoute, 
	...desc: any[]
) => BuilderPatternRoute<request, response, extractObj, floorValues>;

export type RouteStepParamsSkip<floorValues extends {}> = (pickup: Floor<floorValues>["pickup"]) => boolean;

export interface BuilderPatternRoute<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends ExtractObject = ExtractObject,
	floorValues extends {} = {},
>{
	hook: AddHooksLifeCycle<BuilderPatternRoute<request, response, extractObj, floorValues>, request, response>;

	extract<
		localeExtractObj extends extractObj
	>(
		extractObj: localeExtractObj, 
		error?: ErrorExtractFunction<response>,
		...desc: any[]
	): Omit<BuilderPatternRoute<request, response, extractObj, floorValues & FlatExtract<localeExtractObj>>, "hook" | "extract">;

	check<
		checker extends Checker,
		info extends string,
		skipObj extends {skip?: RouteStepParamsSkip<floorValues>;},
		index extends string = never,
		checkerParams extends CheckerGetParmas<checker> = CheckerGetParmas<checker>
	>(
		checker: checker, 
		params: CheckerParamsStep<checker, response, floorValues, info, index> & skipObj,
		...desc: any[]
	): Omit<
		BuilderPatternRoute<
			request, 
			response, 
			extractObj, 
			floorValues & {
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
		skipObj extends {skip?: RouteStepParamsSkip<floorValues>;},
	>(
		process: process, 
		params?: ProcessParamsStep<process, pickup, floorValues> & skipObj,
		...desc: any[]
	): Omit<
		BuilderPatternRoute<
			request, 
			response, 
			extractObj, 
			floorValues & (
				skipObj["skip"] extends AnyFunction ? 
					Partial<PickupDropProcess<process, pickup>> :
					PickupDropProcess<process, pickup>
			)
		>, 
		"hook" | "extract"
	>;

	cut<
		localFloorValue extends Record<string, unknown>, 
		drop extends Exclude<keyof localFloorValue, symbol | number> = never
	>(
		short: CutFunction<request, response, floorValues, localFloorValue>,
		drop?: drop[],
		...desc: any[]
	): Omit<
		BuilderPatternRoute<
			request, 
			response, 
			extractObj, 
			floorValues & Pick<localFloorValue, drop extends keyof localFloorValue ? drop : never>
		>, 
		"hook" | "extract"
	>;

	handler(handlerFunction: HandlerFunction<response, floorValues>, ...desc: any[]): DefaultRoute;
}

export function makeRouteBuilder(
	serverHooksLifeCycle: ServerHooksLifeCycle,
	Route: typeof ExtendsRoute,
	routes: Routes
){
	const declareRoute: DeclareRoute = (method, paths, subAbstractRoute, ...desc) => {
		const currentRoute = new Route(
			method, 
			paths instanceof Array ? paths : [paths], 
			subAbstractRoute,
			desc
		);

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

			routes[currentRoute.method].push(currentRoute);
			serverHooksLifeCycle.onDeclareRoute.launchSubscriber(currentRoute);

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
	};
}
