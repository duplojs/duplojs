import http from "http";
import makeHooksSystem, {HookSystem} from "./hook.ts";
import makeRequest from "./request.ts";
import makeResponse, {__exec__, ResponseInstance} from "./response.ts";
import makeRoutesSystem from "./route.ts";
import makeCheckerSystem from "./checker.ts";
import {bodyToJson, objectToString} from "./hooks/json.ts";
import {bodyToText, textContentType} from "./hooks/text.ts";
import {ErrorToText} from "./hooks/error.ts";
import extractPathAndQueryFromUrl from "./extractPathAndQueryFromUrl.ts";
import makeProcessSystem from "./process.ts";
import {parsCookies, serializeCookies} from "./hooks/cookie.ts";

export interface anotherbackConfig{
	port: number,
	host: string,
	callback?: () => void;
	prefix?: string;
}

export type inputOptions = Record<string, any>;
export type inputCallback<options extends inputOptions = Record<never, never>, addHook = HookSystem["addHook"]> = (addHook: addHook, options?: options) => void | Promise<void>

export default function anotherback(config: anotherbackConfig){

	config.prefix = extractPathAndQueryFromUrl(config.prefix || "").path;
	if(config.prefix === "/")config.prefix = "";

	const {addHook, buildHooks, launchHooks, hooks} = makeHooksSystem([
		"init", "serializeBody", "error", "beforeSent", "afterSent"
	]);
	addHook("init", parsCookies);
	addHook("serializeBody", bodyToJson);
	addHook("serializeBody", bodyToText);
	addHook("error", ErrorToText);
	addHook("beforeSent", serializeCookies);
	addHook("beforeSent", objectToString);
	addHook("beforeSent", textContentType);

	const {createChecker} = makeCheckerSystem();
	const {declareRoute, buildRoute, findRoute, setNotfoundHandler} = makeRoutesSystem(config, hooks);
	const {createProcess} = makeProcessSystem();

	const server = http.createServer( 
		async(serverRequest, serverResponse) => {
			const request = makeRequest(serverRequest, config);
			const response = makeResponse(serverResponse, config);

			try {
				try {
					const {routeFunction, params, notfoundFunction} = findRoute(request.method, request.path);
					
					if(notfoundFunction)notfoundFunction(request, response);
					else {
						request.params = params;
						
						await launchHooks("init", request, response);
		
						if(["POST", "PUT", "PATCH"].includes(request.method)){
							await launchHooks("serializeBody", request, response);
						}
		
						await routeFunction(request, response);
						
						if(response.isSend === false) response.code(503).info("NO_SEND_RESPONSE").send();
					}
				}
				catch (result: any){
					if(result instanceof Error){
						response.code(500);
						response.data = result;
						result = response;
						await launchHooks("error", request, response, result);
					}

					if(result?.[Symbol.hasInstance]?.(ResponseInstance)){
						await launchHooks("beforeSent", request, response);
						result[__exec__]();
						await launchHooks("afterSent", request, response);
					}
					else throw result;
				}
			} 
			catch (error){
				console.error(error);
				serverResponse.writeHead(500, {"content-type": "text/plain;charset=utf-8"});
				if(error instanceof Error)serverResponse.write(error.stack);
				else serverResponse.write("SEE SERVER CONSOLE");
				serverResponse.end();
			}
		}
	);

	return {
		server,
		config,
		launch(){
			buildHooks();
			buildRoute();
			
			return server.listen(
				config.port, 
				config.host,
				0,
				config.callback || (() => console.log("Ready !"))
			);
		},
		addHook,
		input<options extends inputOptions>(inputFunction: inputCallback<options, typeof addHook>, options?: options){
			return inputFunction(addHook, options);
		},
		declareRoute,
		createChecker,
		setNotfoundHandler,
		createProcess
	}; 
}
