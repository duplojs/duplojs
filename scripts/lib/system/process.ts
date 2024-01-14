import {ServerHooksLifeCycle} from "../hook";
import {Process as DefaultProcess} from "../duplose/process";
import {makeProcessBuilder} from "../builder/process";

export type Processes = Record<string, DefaultProcess>;

export function makeProcessSystem(serverHooksLifeCycle: ServerHooksLifeCycle){
	const Process = class extends DefaultProcess<any, any, any, any, any>{};
	const processes: Processes = {};

	const {createProcess} = makeProcessBuilder(serverHooksLifeCycle, Process, processes);

	return {
		createProcess,
		Process,
		processes,
	};
}
