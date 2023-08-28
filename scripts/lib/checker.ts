import makeFloor from "./floor";
import {ServerHooksLifeCycle} from "./hook";
import {Response} from "./response";

type anyFunction = (...args: any) => any;

export type CheckerOutput<outputInfo> = {
	info: outputInfo,
	data?: any,
};

export interface CreateCheckerParameters<
	input extends any, 
	outputInfo extends string, 
	options extends any, 
	context extends Record<string, anyFunction>,
> {
	handler(
		input: input, 
		output: (info: outputInfo, data?: any) => CheckerOutput<outputInfo>, 
		options: options
	): CheckerOutput<outputInfo> | Promise<CheckerOutput<outputInfo>>;
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
	context extends Record<string, anyFunction> = Record<string, anyFunction>
> = {
	name: string,
	handler: CreateCheckerParameters<input, outputInfo, options, context>["handler"],
	options: CheckerParameters<input, outputInfo, options>["options"] | {},
	outputInfo: outputInfo[],
}

export default function makeCheckerSystem(serverHooksLifeCycle: ServerHooksLifeCycle){
	function createChecker<
		input extends any, 
		outputInfo extends string, 
		options extends any, 
		context extends {},
	>(name: string, createCheckerParameters: CreateCheckerParameters<input, outputInfo, options, context>): CheckerExport<input, outputInfo, options, context>
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
