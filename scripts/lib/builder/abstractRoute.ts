import {SubAbstractRoute, SubAbstractRouteParams} from "../duplose/abstractRoute/sub";
import {ErrorExtractFunction, ExtractObject, HandlerFunction} from "../duplose";
import {DeclareRoute, RouteStepParamsSkip} from "./route";
import {Request} from "../request";
import {Response} from "../response";
import {AddHooksLifeCycle, ServerHooksLifeCycle} from "../hook";
import {AnyFunction, FlatExtract} from "../utile";
import {Checker, CheckerGetParmas} from "../duplose/checker";
import {CheckerParamsStep, CheckerStep} from "../step/checker";
import {Process} from "../duplose/process";
import {ProcessParamsStep, ProcessStep} from "../step/process";
import {PickupDropProcess} from "./process";
import {ExtendsAbstractRoute} from "../duplose/abstractRoute";
import {AbstractRoutes} from "../system/abstractRoute";
import {CutFunction, CutStep} from "../step/cut";
import {AbstractRouteInstance} from "../duplose/abstractRoute/instance";

export const __abstractRoute__ = Symbol("abstractRoute");

export type DeclareAbstractRoute<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends ExtractObject = ExtractObject,
	options extends {} = {},
	floor extends {} = {},
> = (
	name: string, 
	subAbstractRoute?: SubAbstractRoute,
	...desc: any[]
) => BuilderPatternAbstractRoute<request, response, extractObj, options, floor>;

export interface AbstractRouteUseFunction<
	request extends Request,
	response extends Response,
	extractObj extends ExtractObject,
	options extends {},
	floor extends {},
>{
	<pickup extends string>(
		params?: SubAbstractRouteParams<
			Exclude<keyof floor, symbol | number>,
			pickup, 
			options
		>, 
		...desc: any[]
	): AbstractRouteInstance<
		SubAbstractRoute<
			Pick<floor, pickup extends keyof floor? pickup : never>
		>,
		request,
		response,
		extractObj
	>;
}

export interface BuilderPatternAbstractRoute<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends ExtractObject = ExtractObject,
	_options extends Record<string, any> = any,
	floor extends {} = {},
>{
	options<
		options extends Record<string, any>
	>(
		options: options, 
		...desc: any[]
	): Omit<
		BuilderPatternAbstractRoute<
			request,
			response,
			extractObj,
			options,
			floor & {options: options}
		>, 
		"options"
	>;

	hook: AddHooksLifeCycle<
		Omit<
			BuilderPatternAbstractRoute<
				request, 
				response, 
				extractObj, 
				_options, 
				floor
			>,
			"options"
		>,
		request, 
		response
	>["addHook"];

	extract<
		localeExtractObj extends Omit<extractObj, "body">,
		localFloor extends FlatExtract<localeExtractObj>
	>(
		extractObj: localeExtractObj,
		error?: ErrorExtractFunction<response>, 
		...desc: any[]
	): Omit<
		BuilderPatternAbstractRoute<
			request, 
			response, 
			extractObj, 
			_options, 
			floor & localFloor
		>, 
		"hook" | "extract" | "options"
	>;

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
		BuilderPatternAbstractRoute<
			request, 
			response, 
			extractObj, 
			_options, 
			floor & {
				[Property in index]: skipObj["skip"] extends AnyFunction ? 
					Extract<checkerParams["output"], {info: info}>["data"] | undefined : 
					Extract<checkerParams["output"], {info: info}>["data"]
			}
		>, 
		"hook" | "extract" | "options"
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
		BuilderPatternAbstractRoute<
			request, 
			response, 
			extractObj, 
			_options, 
			floor & (
				skipObj["skip"] extends AnyFunction ? 
					Partial<PickupDropProcess<process, pickup>> :
					PickupDropProcess<process, pickup>
			)
		>, 
		"hook" | "extract" | "options"
	>;

	cut<
		localFloor extends Record<string, unknown>, 
		drop extends Exclude<keyof localFloor, symbol | number> = never
	>(
		short: CutFunction<request, response, localFloor, floor>,
		drop?: drop[],
		...desc: any[]
	): Omit<
		BuilderPatternAbstractRoute<
			request, 
			response, 
			extractObj, 
			_options, 
			floor & Pick<localFloor, drop extends keyof localFloor ? drop : never>
		>, 
		"hook" | "extract" | "options"
	>;

	handler(
		handlerFunction: HandlerFunction<response, floor>, 
		...desc: any[]
	): Pick<BuilderPatternAbstractRoute<request, response, extractObj, _options, floor>, "build">;
	
	build<
		drop extends Exclude<keyof floor, symbol | number> = never,
	>(
		drop?: drop[], 
		...desc: any[]
	): AbstractRouteUseFunction<
		request, 
		response, 
		extractObj, 
		_options, 
		Pick<floor, drop extends keyof floor ? drop : never>
	>;
}

export function makeAbstractRouteBuilder(
	serverHooksLifeCycle: ServerHooksLifeCycle,
	declareRoute: DeclareRoute,
	AbstractRoute: typeof ExtendsAbstractRoute,
	abstractRoutes: AbstractRoutes
){
	const declareAbstractRoute: DeclareAbstractRoute = (name, subAbstractRoute, ...desc) => {
		const currentAbstractRoute = new AbstractRoute(
			name,
			subAbstractRoute,
			desc
		);

		const options: BuilderPatternAbstractRoute<any, any, any, any, any>["options"] = (options, ...desc) => {
			currentAbstractRoute.setOptions(options, desc);

			return {
				hook,
				extract,
				check,
				build,
				process,
				cut,
				handler,
			};
		};

		const hook: BuilderPatternAbstractRoute["hook"] = (name, hookFunction: AnyFunction) => {
			currentAbstractRoute.hooksLifeCyle[name].addSubscriber(hookFunction);

			return {
				hook,
				extract,
				check,
				process,
				cut,
				handler,
				build,
			};
		};

		const extract: BuilderPatternAbstractRoute<any, any, any, any, any>["extract"] = (extractObj: ExtractObject, error, ...desc) => {
			currentAbstractRoute.setExtract(extractObj, error, desc);

			return {
				check,
				handler,
				process,
				cut,
				build,
			};
		};

		const process: BuilderPatternAbstractRoute<any, any, any, any, any>["process"] = (_process, params, ...desc) => {
			currentAbstractRoute.addStepProcess(
				new ProcessStep(_process, params || {}),
				desc
			);

			return {
				check,
				process,
				handler,
				cut,
				build,
			};
		};

		const check: BuilderPatternAbstractRoute<any, any, any, any, any>["check"] = (checker, params, ...desc) => {
			currentAbstractRoute.addStepChecker(
				new CheckerStep(checker, params),
				desc
			);

			return {
				check,
				handler,
				process,
				cut,
				build,
			};
		};

		const cut: BuilderPatternAbstractRoute<any, any, any, any, any>["cut"] = (short, drop, ...desc) => {
			currentAbstractRoute.addStepCut(
				new CutStep(short, drop || []),
				desc
			);

			return {
				check,
				handler,
				process,
				cut,
				build,
			};
		};

		const handler: BuilderPatternAbstractRoute<any, any, any, any, any>["handler"] = (handlerFunction, ...desc) => {
			currentAbstractRoute.setHandler(handlerFunction, desc);

			return {
				build
			};
		};

		const build: BuilderPatternAbstractRoute<any, any, any, any, any>["build"] = (drop, ...desc) => {
			currentAbstractRoute.setDrop(drop || [], desc);
			
			abstractRoutes.push(currentAbstractRoute);
			serverHooksLifeCycle.onDeclareAbstractRoute.launchSubscriber(currentAbstractRoute);

			return (params, ...desc) => currentAbstractRoute.createInstance(params || {}, desc) as any;
		};

		return {
			options,
			hook,
			extract,
			check,
			process,
			cut,
			handler,
			build,
		};
	};
	
	return {
		declareAbstractRoute,
	};
}
