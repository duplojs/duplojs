import {AbstractRoute} from "./duplose/abstractRoute";
import {MergeAbstractRoute} from "./duplose/abstractRoute/merge";
import {Checker} from "./duplose/checker";
import {Process} from "./duplose/process";
import {Route} from "./duplose/route";
import {Request} from "./request";
import {Response} from "./response";
import {AnyFunction, PromiseOrNot} from "./utile";
import {IncomingMessage, ServerResponse} from "http";

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
	addHook(name: "beforeRouteExecution", functionHook: ReturnType<HooksLifeCycle<request, response>["beforeRouteExecution"]["build"]>): returnType;
	addHook(name: "parsingBody", functionHook: ReturnType<HooksLifeCycle<request, response>["parsingBody"]["build"]>): returnType;
	addHook(name: "onError", functionHook: ReturnType<HooksLifeCycle<request, response>["onError"]["build"]>): returnType;
	addHook(name: "beforeSend", functionHook: ReturnType<HooksLifeCycle<request, response>["beforeSend"]["build"]>): returnType;
	addHook(name: "serializeBody", functionHook: ReturnType<HooksLifeCycle<request, response>["serializeBody"]["build"]>): returnType;
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
	addHook(name: "beforeBuildRouter", functionHook: ReturnType<ServerHooksLifeCycle["beforeBuildRouter"]["build"]>): returnType;
	addHook(name: "afterBuildRouter", functionHook: ReturnType<ServerHooksLifeCycle["afterBuildRouter"]["build"]>): returnType;
	addHook(name: "beforeListenHttpServer", functionHook: ReturnType<ServerHooksLifeCycle["beforeListenHttpServer"]["build"]>): returnType;
}

export class Hook<
	args extends any[] = [], 
	subscriber extends AnyFunction = (...args: args) => PromiseOrNot<boolean | void>
>{
	constructor(numberArgs: args["length"]){
		this.numberArgs = numberArgs;
	}

	private numberArgs: number;
	public subscribers: Array<subscriber | Hook<args, subscriber>> = [];

	addSubscriber(
		subscriber: subscriber | Hook<args, subscriber>, 
		...subscribers: Array<subscriber | Hook<args, subscriber>>
	){
		this.subscribers.push(subscriber, ...subscribers);
	}

	removeSubscriber(subscriber: subscriber | Hook<args>){
		const index = this.subscribers.findIndex(sub => sub === subscriber);
		if(index !== -1) this.subscribers.splice(index, 1);
	}

	removeAllSubscriber(){
		this.subscribers = [];
	}

	launchSubscriber(...args: args): boolean | void
	{
		for(const subscriber of this.subscribers){
			if(subscriber instanceof Hook){
				if(subscriber.launchSubscriber(...args) === true) return true;
			}
			else {
				if(subscriber(...args) === true) return true;
			}
		}
	}

	async launchSubscriberAsync(...args: args): Promise<boolean | void>
	{
		for(const subscriber of this.subscribers){
			if(subscriber instanceof Hook){
				if(await subscriber.launchSubscriberAsync(...args) === true) return true;
			}
			else {
				if(await subscriber(...args) === true) return true;
			}
		}
	}

	launchAllSubscriberAsync(...args: args): Promise<unknown>
	{
		return Promise.all(
			(
				function lauchDeepFunctionSubscriber(subscribers: Array<subscriber | Hook<args, subscriber>>): unknown[]
				{
					const PromiseSubscribersCollection: unknown[] = [];

					subscribers.forEach((subscriber) => {
						if(typeof subscriber === "function"){
							PromiseSubscribersCollection.push(subscriber(...args));
						}
						else {
							PromiseSubscribersCollection.push(
								...lauchDeepFunctionSubscriber(subscriber.subscribers)
							);
						}
					});

					return PromiseSubscribersCollection;
				}
			)(this.subscribers)
		);
	}

	hasSubscriber(subscriber:  subscriber | Hook<args, subscriber>){
		return !!this.subscribers.find(f => f === subscriber);
	}

	build(): subscriber
	{
		const subscribers = (
			function findSubscribers(
				subscribers: Array<subscriber | Hook<args, subscriber>>, 
				flatSubscribers: subscriber[] = []
			){
				subscribers.forEach(subscriber => {
					if(subscriber instanceof Hook){
						findSubscribers(subscriber.subscribers, flatSubscribers);
					}
					else {
						flatSubscribers.push(subscriber);
					}
				});
				return flatSubscribers;
			}
		)(this.subscribers);

		const mapArg = new Array(this.numberArgs).fill(undefined).map((v, i) => `arg${i}`).join(", ");
		const contentFunction = subscribers.map((v, i) => /* js */`
			if(${(v.constructor.name === "AsyncFunction" ? "await " : "")}this.subscribers[${i}](${mapArg}) === true) return;
		`).join("");
		
		return eval(/* js */`(${(/await/.test(contentFunction) ? "async " : "")}function(${mapArg}){\n${contentFunction}\n})`).bind({subscribers});
	}
}

export function makeHooksLifeCycle<
	request extends Request = Request, 
	response extends Response = Response,
>(){
	return {
		onConstructRequest: new Hook<[request: request]>(1),
		onConstructResponse: new Hook<[response: response]>(1),
		beforeRouteExecution: new Hook<[request: request, response: response]>(2),
		parsingBody: new Hook<[request: request, rresponse: response]>(2),
		onError: new Hook<[request: request, response: response, error: Error]>(3),
		beforeSend: new Hook<[request: request, response: response]>(2),
		serializeBody: new Hook<[request: request, response: response]>(2),
		afterSend: new Hook<[request: request, response: response]>(2),
	};
}

export function makeServerHooksLifeCycle(){
	return {
		onDeclareRoute: new Hook<[route: Route]>(1),
		onDeclareAbstractRoute: new Hook<[abstractRoute: AbstractRoute | MergeAbstractRoute]>(1),
		onCreateChecker: new Hook<[checker: Checker]>(1),
		onCreateProcess: new Hook<[process: Process]>(1),
		onReady: new Hook(0),
		onClose: new Hook(0),
		onServerError: new Hook<[serverRequest: IncomingMessage, serverResponse: ServerResponse, error: Error]>(3),
		beforeBuildRouter: new Hook(0),
		afterBuildRouter: new Hook(0),
		beforeListenHttpServer: new Hook(0),
	};
}
