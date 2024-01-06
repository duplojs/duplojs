import makeFloor, {Floor} from "./floor";
import {ServerHooksLifeCycle} from "./hook";
import {Response} from "./response";
import {AnyFunction, PromiseOrNot} from "./utility";

export interface CreateChecker {
	(name: string): Pick<BuilderPatternChecker, "defineOptions" | "handler">;
}

export type CheckerOutput<
	info extends string = string, 
	data extends unknown = unknown
> = {
	info: info,
	data: data,
};

export interface CheckerOutputFunction{
	<
		info extends string,
		data extends unknown = undefined,
	>(info: info, data: data): CheckerOutput<info, data>;
}

export type CheckerCatchFunction<
	outputHandler extends CheckerOutput,
	result extends CheckerOutput["info"],
> = (
	response: Response, 
	info: Exclude<outputHandler, {info: result}>["info"], 
	data: Exclude<outputHandler, {info: result}>["data"],
	pickup: Floor<Record<string, unknown>>["pickup"]
) => void

export interface CheckerPreComplated<
	outputHandler extends CheckerOutput,
	result extends CheckerOutput["info"],
	indexing extends string
>{
	result?: (result & outputHandler["info"]) | (result[] & outputHandler["info"][]),
	indexing?: indexing,
}

export interface BuilderPatternChecker<
	options extends Record<string, any> = never,
	input extends unknown = unknown,
	outputHandler extends CheckerOutput = never,
	allPrecompleted extends Record<string, any> = {},
>{
	defineOptions<
		options extends Record<string, any>
	>(options: options): Pick<
		BuilderPatternChecker<
			options
		>, 
		"handler"
	>;

	handler<
		input extends unknown,
		outputHandler extends CheckerOutput,
	>(
		handler: (input: input, output: CheckerOutputFunction, options: options) => PromiseOrNot<outputHandler>
	): Pick<
		BuilderPatternChecker<
			options,
			input,
			outputHandler
		>, 
		"addPrecompleted" | "build"
	>;

	addPrecompleted<
		name extends string,
		result extends outputHandler["info"] = never,
		indexing extends string = never,
		catchBlock extends {catch?: CheckerCatchFunction<outputHandler, result>} = {catch?: CheckerCatchFunction<outputHandler, result>},
	>(
		name: name,
		params: CheckerPreComplated<outputHandler, result, indexing> & catchBlock
	): Pick<
		BuilderPatternChecker<
			options,
			input,
			outputHandler,
			allPrecompleted & {
				[p in name]: {
					result: result extends string ? result : undefined,
					indexing: indexing extends string ? indexing : undefined,
					catch: catchBlock["catch"] extends AnyFunction ? catchBlock["catch"] : undefined,
				}
			}
		>, 
		"build" | "addPrecompleted"
	>;

	build(...desc: any): Checker<
		options,
		input,
		outputHandler,
		allPrecompleted
	>
}

export class Checker<
	options extends Record<string, any> = any,
	input extends unknown = any,
	outputHandler extends CheckerOutput = CheckerOutput,
	allPreCompleted extends Record<string, any> = {},
>{
	constructor(
		public name: string,
		public options: options,
		public handler: (input: input) => PromiseOrNot<outputHandler>,
		public precomplete: allPreCompleted,
		public desc: any[],
	){}
}

export type Checkers = Record<string, Checker>

export type CheckerGetParmas<checker extends Checker> = 
	checker extends Checker<
		infer options,
		infer input,
		infer output
	> 
	? {options: options, input: input, output: output} 
	: never

export default function makeCheckerSystem(serverHooksLifeCycle: ServerHooksLifeCycle){
	const checkers: Checkers = {};

	const createChecker: CreateChecker = (name) => {
		let grapOptions: any;
		const defineOptions: BuilderPatternChecker<any, any, any, any>["defineOptions"] = (options) => {
			grapOptions = options;
			
			return {
				handler,
			};
		};

		let grapHandler: any;
		const handler: BuilderPatternChecker<any, any, any, any>["handler"] = (handler) => {
			grapHandler = handler;

			return {
				addPrecompleted,
				build,
			};
		};

		let precomplete: any = {};
		const addPrecompleted: BuilderPatternChecker<any, any, any, any>["addPrecompleted"] = (name, params) => {
			precomplete[name] = params;

			return {
				addPrecompleted,
				build
			};
		};

		const build: BuilderPatternChecker<any, any, any, any>["build"] = (...desc: any[]) => {
			checkers[name] = new Checker<any, any, any, any>(name, grapOptions, grapHandler, precomplete, desc);

			serverHooksLifeCycle.onCreateChecker.syncLaunchSubscriber(checkers[name]);

			return checkers[name];
		};

		return {
			defineOptions,
			handler
		} as any;
	};

	return {
		createChecker,
		checkers,
	};
}
