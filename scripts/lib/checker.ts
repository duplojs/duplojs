import makeFloor from "./floor";
import {ServerHooksLifeCycle} from "./hook";
import Response from "./response";

export type CheckerOutput<outputInfo> = {
	info: outputInfo,
	data?: any,
};

export interface CreateCheckerParameters<input, outputInfo, options> {
	handler(
		input: input, 
		output: (info: outputInfo, data?: any) => CheckerOutput<outputInfo>, 
		options: options
	): CheckerOutput<outputInfo> | Promise<CheckerOutput<outputInfo>>;
	readonly outputInfo: outputInfo[];
	readonly options?: options;
}
export interface CheckerParameters<input, outputInfo, options> {
	input(pickup: ReturnType<typeof makeFloor>["pickup"]): input;
	validate(info: outputInfo, data?: any): boolean;
	catch(response: Response, info: outputInfo, data: any, existProcess: () => never): void;
	output?: (drop: ReturnType<typeof makeFloor>["drop"], info: outputInfo, data?: any) => void;
	readonly options?: options;
}

export type CheckerExport<input = any, outputInfo = string, options = any> = {
	name: string,
	handler: CreateCheckerParameters<input, outputInfo, options>["handler"],
	options: CheckerParameters<input, outputInfo, options>["options"] | {},
	outputInfo: outputInfo[],
}

export default function makeCheckerSystem(serverHooksLifeCycle: ServerHooksLifeCycle){
	function createChecker<
		input extends any,
		outputInfo extends string,
		options,
	>(name: string, createCheckerParameters: CreateCheckerParameters<input, outputInfo, options>): CheckerExport<input, outputInfo, options>
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
