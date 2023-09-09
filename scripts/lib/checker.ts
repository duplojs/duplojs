import makeFloor from "./floor";
import {ServerHooksLifeCycle} from "./hook";
import {Response} from "./response";
import {PromiseOrNot} from "./utility";

export type ReturnCheckerType<checker extends CheckerExport, exclude = never> = Exclude<Awaited<ReturnType<checker["handler"]>>["data"], exclude>;

type anyFunction = (...args: any) => any;

export type CheckerOutput<
	outputInfo extends string = string, 
	outputData extends any = any
> = {
	info: outputInfo,
	data: outputData,
};

interface CheckerOutputFunction<outputInfo extends string>{
	output<outputData extends any = any>(info: outputInfo, data: outputData): CheckerOutput<outputInfo, outputData>;
}

export interface CreateCheckerParameters<
	input extends any, 
	outputInfo extends string, 
	options extends any, 
	returnOutputType extends CheckerOutput<outputInfo>,
	context extends Record<string, anyFunction>,
> {
	handler(
		input: input, 
		output: CheckerOutputFunction<outputInfo>["output"],
		options: options
	): PromiseOrNot<returnOutputType>;
	outputInfo: outputInfo[];
	options?: options;
}
export interface CheckerParameters<input, outputInfo, options> {
	input(pickup: ReturnType<typeof makeFloor>["pickup"]): input;
	validate(info: outputInfo, data?: any): boolean;
	catch(response: Response, info: outputInfo, data: any, existProcess: () => never): void;
	output?: (drop: ReturnType<typeof makeFloor>["drop"], info: outputInfo, data?: any) => void;
	readonly options?: options;
}

export type CheckerExport<
	input extends any = any, 
	outputInfo extends string = string, 
	options extends any = any, 
	returnOutputType extends CheckerOutput<outputInfo> = CheckerOutput<outputInfo>,
	context extends Record<string, anyFunction> = Record<string, anyFunction>
> = {
	name: string,
	handler: CreateCheckerParameters<input, outputInfo, options, returnOutputType, context>["handler"],
	options: CheckerParameters<input, outputInfo, options>["options"] | {},
	outputInfo: outputInfo[],
}

export default function makeCheckerSystem(serverHooksLifeCycle: ServerHooksLifeCycle){
	function createChecker<
		input extends any, 
		outputInfo extends string, 
		options extends any, 
		returnOutputType extends CheckerOutput<outputInfo>,
		context extends {},
	>(name: string, createCheckerParameters: CreateCheckerParameters<input, outputInfo, options, returnOutputType, context>): CheckerExport<input, outputInfo, options, returnOutputType, context>
	{
		const checker = {
			name,
			handler: createCheckerParameters.handler,
			options: createCheckerParameters.options,
			outputInfo: createCheckerParameters.outputInfo,
		};

		serverHooksLifeCycle.onCreateChecker.launchSubscriber(checker);

		return checker;
	}

	return {
		createChecker
	};
}
