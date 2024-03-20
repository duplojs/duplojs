import {Checker as DefaultChecker, CheckerOutput, Checker, CheckerOutputFunction, CheckerPrecompletion, CheckerCatchFunction} from "../duplose/checker";
import {ServerHooksLifeCycle} from "../hook";
import {Checkers} from "../system/checker";
import {AnyFunction, Floor, PromiseOrNot} from "../utile";

export type CreateChecker<
	_options extends Record<string, any> = never,
	input extends unknown = unknown,
	outputHandler extends CheckerOutput = never,
> = (
	name: string, 
	...desc: any[]
) => Pick<
	BuilderPatternChecker<_options, input, outputHandler>, 
	"options" | "handler"
>;

export interface BuilderPatternChecker<
	_options extends Record<string, any> = never,
	input extends unknown = unknown,
	outputHandler extends CheckerOutput = never,
	_preCompletions extends Record<string, any> = {},
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
		"preCompletion" | "build"
	>;

	preCompletion<
		name extends string,
		result extends outputHandler["info"] = never,
		indexing extends string = never,
		catchBlock extends {catch?: CheckerCatchFunction<outputHandler, result>} = {catch?: CheckerCatchFunction<outputHandler, result>},
	>(
		name: name,
		params: CheckerPrecompletion<outputHandler, result, indexing> & catchBlock, 
		...desc: any[]
	): Pick<
		BuilderPatternChecker<
			_options,
			input,
			outputHandler,
			_preCompletions & {
				[p in name]: {
					result: result extends string ? result : undefined,
					indexing: indexing extends string ? indexing : undefined,
					catch: catchBlock["catch"] extends AnyFunction ? catchBlock["catch"] : undefined,
				}
			}
		>, 
		"build" | "preCompletion"
	>;

	build(...desc: any[]): Checker<
		_options,
		input,
		outputHandler,
		_preCompletions
	>
}

export default function makeCheckerBuilder(
	serverHooksLifeCycle: ServerHooksLifeCycle,
	Checker: typeof DefaultChecker,
	checkers: Checkers
){

	const createChecker: CreateChecker<any, any, any> = (name, ...desc) => {
		const currentChecker = new Checker<any, any, any, any>(name, desc);

		const options: BuilderPatternChecker<any, any, any, any>["options"] = (options, ...desc) => {
			currentChecker.setOptions(options, desc);
			
			return {
				handler,
			};
		};

		const handler: BuilderPatternChecker<any, any, any, any>["handler"] = (handler, ...desc) => {
			currentChecker.setHandler(handler, desc);

			return {
				preCompletion,
				build,
			};
		};

		const preCompletion: BuilderPatternChecker<any, any, any, any>["preCompletion"] = (name, params, ...desc) => {
			currentChecker.preCompletion(name, params, desc);

			return {
				preCompletion,
				build
			};
		};

		const build: BuilderPatternChecker<any, any, any, any>["build"] = (...desc) => {
			currentChecker.addDesc("drop", desc);

			checkers[name] = currentChecker;

			serverHooksLifeCycle.onCreateChecker.launchSubscriber(checkers[name]);
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
