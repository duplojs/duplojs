import {Checker as DefaultChecker, CheckerOutput, Checker, CheckerOutputFunction, CheckerPreComplated} from "../duplose/checker";
import {Floor} from "../floor";
import {ServerHooksLifeCycle} from "../hook";
import {Response} from "../response";
import {Checkers} from "../system/checker";
import {AnyFunction, PromiseOrNot} from "../utile";

export type CreateChecker<
	_options extends Record<string, any> = never,
	input extends unknown = unknown,
	outputHandler extends CheckerOutput = never,
> = (name: string) => Pick<
	BuilderPatternChecker<_options, input, outputHandler>, 
	"options" | "handler"
>;

export type CheckerCatchFunction<
	outputHandler extends CheckerOutput,
	result extends CheckerOutput["info"],
> = (
	response: Response, 
	info: Exclude<outputHandler, {info: result}>["info"], 
	data: Exclude<outputHandler, {info: result}>["data"],
	pickup: Floor<Record<string, unknown>>["pickup"]
) => void

export interface BuilderPatternChecker<
	_options extends Record<string, any> = never,
	input extends unknown = unknown,
	outputHandler extends CheckerOutput = never,
	allPrecompleted extends Record<string, any> = {},
>{
	options<
		options extends Record<string, any>
	>(
		options: options, 
		...desc: any[]
	): Pick<
		BuilderPatternChecker<
			options
		>, 
		"handler"
	>;

	handler<
		input extends unknown,
		outputHandler extends CheckerOutput,
	>(
		handler: (input: input, output: CheckerOutputFunction, options: _options) => PromiseOrNot<outputHandler>, 
		...desc: any[]
	): Pick<
		BuilderPatternChecker<
			_options,
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
		params: CheckerPreComplated<outputHandler, result, indexing> & catchBlock, 
		...desc: any[]
	): Pick<
		BuilderPatternChecker<
			_options,
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

	build(...desc: any[]): Checker<
		_options,
		input,
		outputHandler,
		allPrecompleted
	>
}

export default function makeCheckerBuilder(
	serverHooksLifeCycle: ServerHooksLifeCycle,
	Checker: typeof DefaultChecker,
	checkers: Checkers
){

	const createChecker: CreateChecker<any, any, any> = (name) => {
		const currentChecker = new Checker<any, any, any, any>(name);

		const options: BuilderPatternChecker<any, any, any, any>["options"] = (options, ...desc) => {
			currentChecker.setOptions(options, desc);
			
			return {
				handler,
			};
		};

		const handler: BuilderPatternChecker<any, any, any, any>["handler"] = (handler, ...desc) => {
			currentChecker.setHandler(handler, desc);

			return {
				addPrecompleted,
				build,
			};
		};

		const addPrecompleted: BuilderPatternChecker<any, any, any, any>["addPrecompleted"] = (name, params, ...desc) => {
			currentChecker.addPrecompleted(name, params, desc);

			return {
				addPrecompleted,
				build
			};
		};

		const build: BuilderPatternChecker<any, any, any, any>["build"] = (...desc) => {
			currentChecker.addDesc("build", desc);

			checkers[name] = currentChecker;

			serverHooksLifeCycle.onCreateChecker.syncLaunchSubscriber(checkers[name]);
			return checkers[name];
		};

		return {
			options,
			handler
		};
	};

	return {
		createChecker
	};
}
