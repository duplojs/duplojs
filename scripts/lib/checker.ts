import makeFloor from "./floor";
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

export interface CheckerParametersUse<input, outputInfo, options> {
	input(): input;
	validate(info: outputInfo, data?: any): boolean;
	catch: (info: outputInfo, data?: any) => void;
	output?: (info: outputInfo, data?: any) => void;
	readonly options?: options;
}

export interface Checker<input, outputInfo, options> {
	(checkerParameters: CheckerParameters<input, outputInfo, options>): CheckerExport;
	use(checkerParametersUse: CheckerParametersUse<input, outputInfo, options>): void;
	useAsync(checkerParametersUse: CheckerParametersUse<input, outputInfo, options>): Promise<void>;
}

export type CheckerExport<input = any, outputInfo = string, options = any> = {
	name: string,
	handler: CreateCheckerParameters<input, outputInfo, options>["handler"],
	options: CheckerParameters<input, outputInfo, options>["options"] | {},
	input: CheckerParameters<input, outputInfo, options>["input"],
	validate: CheckerParameters<input, outputInfo, options>["validate"],
	catch: CheckerParameters<input, outputInfo, options>["catch"],
	output?: CheckerParameters<input, outputInfo, options>["output"],
	type: string,
}

export default function makeCheckerSystem(){
	function createChecker<
		input extends any,
		outputInfo extends string,
		options,
	>(name: string, createCheckerParameters: CreateCheckerParameters<input, outputInfo, options>){
		const checker: Checker<input, outputInfo, options> = function(checkerParameters){
			return {
				name,
				handler: createCheckerParameters.handler,
				options: checkerParameters.options || createCheckerParameters.options || {},
				input: checkerParameters.input,
				validate: checkerParameters.validate,
				catch: checkerParameters.catch,
				output: checkerParameters.output as CheckerExport["output"],
				type: "checker",
			};
		};

		checker.use = function(checkerParameters){
			let result = createCheckerParameters.handler(
				checkerParameters.input(),
				(info, data) => ({info, data}),
				checkerParameters.options || createCheckerParameters.options || {} as any
			) as CheckerOutput<outputInfo>;
			if(!checkerParameters.validate(result.info, result.data))checkerParameters.catch(result.info, result.data);
			checkerParameters.output?.(result.data);
		};

		checker.useAsync = async function(checkerParameters){
			let result = await createCheckerParameters.handler(
				checkerParameters.input(),
				(info, data) => ({info, data}),
				checkerParameters.options || createCheckerParameters.options || {} as any
			);
			if(!checkerParameters.validate(result.info, result.data))checkerParameters.catch(result.info, result.data);
			checkerParameters.output?.(result.data);
		};

		return checker;
	}

	return {
		createChecker
	};
}
