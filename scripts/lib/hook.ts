import {AbstractRouteSubscribers} from "./abstractRoute";
import {CheckerExport} from "./checker";
import {ProcessSubscribers} from "./process";
import {Request} from "./request";
import {Response} from "./response";
import {RouteSubscribers} from "./route";

export type HooksLifeCycle<
	request extends Request = Request, 
	response extends Response = Response,
> = ReturnType<typeof makeHooksLifeCycle<request, response>>;

export type ServerHooksLifeCycle = ReturnType<typeof makeServerHooksLifeCycle>;

export interface AddHooksLifeCycle<
	returnType extends any = any,
	request extends Request = Request, 
	response extends Response = Response,
>{
	addHook(name: "onConstructRequest", functionHook: ReturnType<HooksLifeCycle<request, response>["onConstructRequest"]["build"]>): returnType;
	addHook(name: "onConstructResponse", functionHook: ReturnType<HooksLifeCycle<request, response>["onConstructResponse"]["build"]>): returnType;
	addHook(name: "beforeParsingBody", functionHook: ReturnType<HooksLifeCycle<request, response>["beforeParsingBody"]["build"]>): returnType;
	addHook(name: "onError", functionHook: ReturnType<HooksLifeCycle<request, response>["onError"]["build"]>): returnType;
	addHook(name: "beforeSend", functionHook: ReturnType<HooksLifeCycle<request, response>["beforeSend"]["build"]>): returnType;
	addHook(name: "afterSend", functionHook: ReturnType<HooksLifeCycle<request, response>["afterSend"]["build"]>): returnType;
}

export interface AddServerHooksLifeCycle<returnType extends any = any>{
	addHook(name: "onClose", functionHook: ReturnType<ServerHooksLifeCycle["onClose"]["build"]>): returnType;
	addHook(name: "onCreateChecker", functionHook: ReturnType<ServerHooksLifeCycle["onCreateChecker"]["build"]>): returnType;
	addHook(name: "onCreateProcess", functionHook: ReturnType<ServerHooksLifeCycle["onCreateProcess"]["build"]>): returnType;
	addHook(name: "onDeclareAbstractRoute", functionHook: ReturnType<ServerHooksLifeCycle["onDeclareAbstractRoute"]["build"]>): returnType;
	addHook(name: "onDeclareRoute", functionHook: ReturnType<ServerHooksLifeCycle["onDeclareRoute"]["build"]>): returnType;
	addHook(name: "onReady", functionHook: ReturnType<ServerHooksLifeCycle["onReady"]["build"]>): returnType;
	addHook(name: "onServerError", functionHook: ReturnType<ServerHooksLifeCycle["onServerError"]["build"]>): returnType;
}

type PromiseOrNot<T> = T | Promise<T>;

export default function makeHook<TypeHookFunction extends((...any: any) => any)>(numberArgs: number){
	const args = Array(numberArgs).fill(undefined).map((value, index) => `arg${index}`).join(", ");
	let subscribers: TypeHookFunction[] = [];

	return {
		subscribers,
		addSubscriber: (hookFunction: TypeHookFunction) => {subscribers.push(hookFunction);},
		copySubscriber: (...spreadOtherSubscribers: Array<TypeHookFunction[]>) => subscribers.push(...spreadOtherSubscribers.flat()),
		launchSubscriber: ((...agrs) => subscribers.forEach(fnc => fnc(...agrs))) as TypeHookFunction,
		build: (): TypeHookFunction => {
			let stringFunction = "";
			let isAsync = false;
			subscribers.forEach((fnc, index) => {
				if(fnc.constructor.name === "AsyncFunction"){ 
					stringFunction += /* js */`
						if(await this.subscribers[${index}](${args}) === true) return;
					`;
					isAsync = true;
				}
				else stringFunction += /* js */`
					if(this.subscribers[${index}](${args}) === true) return;
				`;
			});
			return eval(/* js */`(${(isAsync ? "async" : "")} function(${args}){${stringFunction}})`).bind({subscribers});
		},
	};
}

export function makeHooksLifeCycle<
	request extends Request = Request, 
	response extends Response = Response,
>(){
	return {
		onConstructRequest: makeHook<((request: request) => PromiseOrNot<true | void>)>(1),
		onConstructResponse: makeHook<((response: response) => PromiseOrNot<true | void>)>(1),
		beforeParsingBody: makeHook<((request: request, response: response) => PromiseOrNot<true | void>)>(2),
		onError: makeHook<((request: request, response: response, error: Error) => PromiseOrNot<true | void>)>(3),
		beforeSend: makeHook<((request: request, response: response) => PromiseOrNot<true | void>)>(2),
		afterSend: makeHook<((request: request, response: response) => PromiseOrNot<true | void>)>(2),
	};
}

export function makeServerHooksLifeCycle(){
	return {
		onDeclareRoute: makeHook<((route: RouteSubscribers) => PromiseOrNot<true | void>)>(1),
		onDeclareAbstractRoute: makeHook<((abstractRoute: AbstractRouteSubscribers) => PromiseOrNot<true | void>)>(1),
		onCreateChecker: makeHook<((checker: CheckerExport) => PromiseOrNot<true | void>)>(1),
		onCreateProcess: makeHook<((process: ProcessSubscribers) => PromiseOrNot<true | void>)>(1),
		onReady: makeHook<(() => PromiseOrNot<true | void>)>(0),
		onClose: makeHook<(() => PromiseOrNot<true | void>)>(0),
		onServerError: makeHook<((error: Error) => PromiseOrNot<true | void>)>(1),
	};
}
