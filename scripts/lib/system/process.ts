import {ServerHooksLifeCycle} from "../hook";
import {Process as DefaultProcess} from "../duplose/process";
import {makeProcessBuilder} from "../builder/process";
import {Response} from "../response";
import {DuploConfig} from "../main";
import {ErrorExtractFunction} from "../duplose";

export type Processes = Record<string, DefaultProcess>;

export interface ProcessEditableProperty{
	defaultErrorExtract: ErrorExtractFunction<Response>;
}

export function makeProcessSystem(
	config: DuploConfig,
	serverHooksLifeCycle: ServerHooksLifeCycle
){
	class Process extends DefaultProcess<any, any, any, any, any>{
		public get config(){
			return config;
		}

		public get defaultErrorExtract(){
			return Process.editableProperty.defaultErrorExtract;
		}

		public static editableProperty: ProcessEditableProperty = {
			defaultErrorExtract: (response, type, index) => response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send(),
		};
	}

	const setDefaultErrorExtract = (errorExtract: ErrorExtractFunction<Response>) => {
		Process.editableProperty.defaultErrorExtract = errorExtract;
	};

	const processes: Processes = {};

	const {createProcess} = makeProcessBuilder(serverHooksLifeCycle, Process, processes);

	return {
		createProcess,
		setDefaultErrorExtract,
		Process,
		processes,
	};
}
