import {Request} from "./request";
import {Response} from "./response";

type hookFunction<data = any> = (
	request: Request, 
	response: Response,
	data?: data
) => void | Promise<void>;

export default function makeHooksSystem<event extends string>(eventsName: event[]){
	const hooks: Record<string, hookFunction[]> = {};
	const buildedHooks: Record<string, hookFunction> = {};
	eventsName.forEach(name => hooks[name] = []);

	return {
		addHook(
			name: event, 
			hookFunction: hookFunction,
		){
			if(!hooks[name]) throw new Error();
			hooks[name].push(hookFunction);
		},
		buildHooks(){
			Object.entries(hooks).forEach(([key, value]) => {
				let stringFunction = "";
				let isAsync = false;
				value.forEach((fnc, index) => {
					if(fnc.constructor.name === "AsyncFunction"){ 
						stringFunction += /* js */`
							await hooks.${key}[${index}](req, res, data);
						`;
						isAsync = true;
					}
					else stringFunction += /* js */`
						hooks.${key}[${index}](req, res, data);
					`;
				});
				
				buildedHooks[key] = eval((isAsync ? "async" : "") + /* js */`(req, res, data) => {${stringFunction}}`);
			});
		},
		launchHooks(
			name: event,
			request: Request, 
			response: Response,
			data?: any,
		){
			if(!buildedHooks[name]) throw new Error();
			return buildedHooks[name](request, response, data);
		},
		copyHook(otherHooks: typeof this.hooks, from: string, to: event){
			hooks[to] = [...hooks[to], ...otherHooks[from]];
		},
		hooks,
		buildedHooks,
	};
}

export type HookSystem = ReturnType<typeof makeHooksSystem>;
