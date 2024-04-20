import {RouteStepParamsSkip} from "../builder/route";
import {AddHooksLifeCycle, ServerHooksLifeCycle} from "../hook";
import {Request} from "../request";
import {Response} from "../response";
import {AnyFunction, FlatExtract, Floor} from "../utils";
import {Process as DefaultProcess, ExtendsProcess} from "../duplose/process";
import {Processes} from "../system/process";
import {Checker, CheckerGetParmas} from "../duplose/checker";
import {CheckerParamsStep, CheckerStep} from "../step/checker";
import {ProcessParamsStep, ProcessStep} from "../step/process";
import {CutFunction, CutStep} from "../step/cut";
import {ErrorExtractFunction, ExtractObject, HandlerFunction} from "../duplose";

export type CreateProcess<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends ExtractObject = ExtractObject,
> = (
	name: string, 
	...desc: any[]
) => BuilderPatternProcess<request, response, extractObj>;

export type PickupDropProcess<
	process extends DefaultProcess,
	pickup extends string,
> = process extends DefaultProcess<infer input, infer options, infer extractObj, infer floorValues>?
	Pick<
		floorValues, 
		pickup extends keyof floorValues ? pickup : never
	> : never;

export interface BuilderPatternProcess<
	request extends Request = Request, 
	response extends Response = Response,
	extractObj extends ExtractObject = ExtractObject,
	_options extends Record<string, any> = any,
	_input extends any = any,
	floorValues extends {} = {},
>{
	options<
		options extends Record<string, any>
	>(
		options: options, 
		...desc: any[]
	): Omit<
		BuilderPatternProcess<
			request,
			response,
			extractObj,
			options,
			_input,
			floorValues & {options: options}
		>, 
		"options"
	>;

	input<
		input extends unknown
	>(
		input: (pickup: Floor<Record<string, unknown>>["pickup"]) => input, 
		...desc: any[]
	): Omit<
		BuilderPatternProcess<
			request,
			response,
			extractObj,
			_options,
			input,
			floorValues & {input: input}
		>, 
		"options" | "input"
	>;

	hook: AddHooksLifeCycle<
		Omit<
			BuilderPatternProcess<
				request, 
				response, 
				extractObj, 
				_options, 
				_input, 
				floorValues
			>,
			"options" | "input"
		>, 
		request, 
		response
	>;

	extract<
		localeExtractObj extends extractObj,
		localFloorValue extends FlatExtract<localeExtractObj>,
	>(
		extractObj: localeExtractObj, 
		error?: ErrorExtractFunction<response>, 
		...desc: any[]
	): Omit<
		BuilderPatternProcess<
			request, 
			response, 
			extractObj, 
			_options, 
			_input, 
			floorValues & localFloorValue
		>, 
		"hook" | "extract" | "options" | "input"
	>;

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
		BuilderPatternProcess<
			request, 
			response, 
			extractObj, 
			_options, 
			_input, 
			floorValues & {
				[Property in index]: skipObj["skip"] extends AnyFunction ? 
					Extract<checkerParams["output"], {info: info}>["data"] | undefined : 
					Extract<checkerParams["output"], {info: info}>["data"]
			}
		>, 
		"hook" | "extract" | "options" | "input"
	>; 

	process<
		process extends DefaultProcess,
		pickup extends string,
		skipObj extends {skip?: RouteStepParamsSkip<floorValues>;},
	>(
		process: process, 
		params?: ProcessParamsStep<process, pickup, floorValues> & skipObj,
		...desc: any[]
	): Omit<
		BuilderPatternProcess<
			request, 
			response, 
			extractObj, 
			_options, 
			_input, 
			floorValues & (
				skipObj["skip"] extends AnyFunction ? 
					Partial<PickupDropProcess<process, pickup>> :
					PickupDropProcess<process, pickup>
			)
		>, 
		"hook" | "extract" | "options" | "input"
	>;

	cut<
		localFloorValue extends Record<string, unknown>, 
		drop extends Exclude<keyof localFloorValue, symbol | number> = never
	>(
		short: CutFunction<request, response, floorValues, localFloorValue>,
		drop?: drop[],
		...desc: any[]
	): Omit<
		BuilderPatternProcess<
			request, 
			response, 
			extractObj, 
			_options, 
			_input, 
			floorValues & Pick<localFloorValue, drop extends keyof localFloorValue ? drop : never>
		>, 
		"hook" | "extract" | "options" | "input"
	>;

	handler(
		handlerFunction: HandlerFunction<response, floorValues>, 
		...desc: any[]
	): Pick<
		BuilderPatternProcess<
			request, 
			response, 
			extractObj, 
			_options, 
			_input, 
			floorValues
		>, 
		"build"
	>;
	
	build<drop extends string>(
		drop?: (keyof floorValues)[] & drop[], 
		...desc: any[]
	): DefaultProcess<_input, _options, extractObj, floorValues, drop>;
}

export function makeProcessBuilder(
	serverHooksLifeCycle: ServerHooksLifeCycle,
	Process: typeof ExtendsProcess,
	processes: Processes
){
	const createProcess: CreateProcess = (name, ...desc) => {
		const currentProcess = new Process(name, desc);

		const options: BuilderPatternProcess<any, any, any, any, any, any>["options"] = (options, ...desc) => {
			currentProcess.setOptions(options, desc);

			return {
				input,
				hook,
				extract,
				check,
				build,
				process,
				cut,
				handler,
			};
		};

		const input: BuilderPatternProcess<any, any, any, any, any, any>["input"] = (input, ...desc) => {
			currentProcess.setInput(input, desc);

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

		const hook: BuilderPatternProcess<any, any, any, any, any, any>["hook"] = (name, hookFunction: AnyFunction) => {
			currentProcess.hooksLifeCyle[name].addSubscriber(hookFunction);

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

		const extract: BuilderPatternProcess<any, any, any, any, any, any>["extract"] = (extractObj, error?, ...desc) => {
			currentProcess.setExtract(extractObj, error, desc);
			return {
				handler,
				check,
				build,
				process,
				cut,
			};
		};

		const process: BuilderPatternProcess<any, any, any, any, any, any>["process"] = (_process, params, ...desc) => {
			currentProcess.addStepProcess(
				new ProcessStep(_process, params || {}),
				desc
			);

			return {
				check,
				process,
				handler,
				build,
				cut,
			};
		};

		const check: BuilderPatternProcess<any, any, any, any, any, any>["check"] = (checker, params, ...desc) => {
			currentProcess.addStepChecker(
				new CheckerStep(checker, params),
				desc
			);

			return {
				check,
				handler,
				build,
				process,
				cut,
			};
		};

		const cut: BuilderPatternProcess<any, any, any, any, any, any>["cut"] = (short, drop, ...desc) => {
			currentProcess.addStepCut(
				new CutStep(short, drop || []),
				desc
			);

			return {
				check,
				handler,
				build,
				process,
				cut,
			};
		};

		const handler: BuilderPatternProcess<any, any, any, any, any, any>["handler"] = (handlerFunction, ...desc) => {
			currentProcess.setHandler(handlerFunction, desc);

			return {
				build
			};
		};

		const build: BuilderPatternProcess<any, any, any, any, any, any>["build"] = (drop, ...desc) => {
			currentProcess.setDrop(drop || [], desc);

			processes.push(currentProcess);
			serverHooksLifeCycle.onCreateProcess.launchSubscriber(currentProcess);
			
			return currentProcess;
		};

		return {
			options,
			input,
			hook,
			extract,
			check,
			handler,
			process,
			cut,
			build,
		};
	};

	return {
		createProcess
	};
}
