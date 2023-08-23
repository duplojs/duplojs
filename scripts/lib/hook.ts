import Request from "./request";
import Response from "./response";

export type HooksLifeCycle = ReturnType<typeof makeHooksLifeCycle>;

export interface AddHooksLifeCycle<returnType extends any = any>{
	addHook(name: "onConstructRequest", functionHook: ReturnType<HooksLifeCycle["onConstructRequest"]["build"]>): returnType;
	addHook(name: "onConstructResponse", functionHook: ReturnType<HooksLifeCycle["onConstructResponse"]["build"]>): returnType;
	addHook(name: "beforeParsingBody", functionHook: ReturnType<HooksLifeCycle["beforeParsingBody"]["build"]>): returnType;
	addHook(name: "onError", functionHook: ReturnType<HooksLifeCycle["onError"]["build"]>): returnType;
	addHook(name: "beforeSend", functionHook: ReturnType<HooksLifeCycle["beforeSend"]["build"]>): returnType;
	addHook(name: "afterSend", functionHook: ReturnType<HooksLifeCycle["afterSend"]["build"]>): returnType;
}

type PromiseOrNot<T> = T | Promise<T>;

export default function makeHook<TypeHookFunction extends((...any: any) => any)>(numberArgs: number){
	const args = Array(numberArgs).fill(undefined).map((value, index) => `arg${index}`).join(", ");
	let subscribers: TypeHookFunction[] = [];

	return {
		subscribers,
		addSubscriber: (hookFunction: TypeHookFunction) => {subscribers.push(hookFunction);},
		copySubscriber: (...spreadOtherSubscribers: Array<TypeHookFunction[]>) => subscribers.push(...spreadOtherSubscribers.flat()),
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

export function makeHooksLifeCycle(){
	return {
		onConstructRequest: makeHook<((request: Request) => PromiseOrNot<false | void>)>(1),
		onConstructResponse: makeHook<((response: Response) => PromiseOrNot<false | void>)>(1),
		beforeParsingBody: makeHook<((request: Request, response: Response) => PromiseOrNot<false | void>)>(2),
		onError: makeHook<((request: Request, response: Response, error: Error) => PromiseOrNot<false | void>)>(3),
		beforeSend: makeHook<((request: Request, response: Response) => PromiseOrNot<false | void>)>(2),
		afterSend: makeHook<((request: Request, response: Response) => PromiseOrNot<false | void>)>(2),
	};
}
