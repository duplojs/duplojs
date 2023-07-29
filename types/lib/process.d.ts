import { errorExtract, extractObj } from "./route";
import { returnCheckerExec, shortChecker } from "./checker";
import { HookSystem } from "./hook";
import makeFloor from "./floor";
import { Request } from "./request";
import { Response } from "./response";
export type handlerFunction = (floor: ReturnType<typeof makeFloor>, response: Response, existProcess: () => never) => void;
export type processBuild<values extends string, input extends {}, options extends {}> = {
    options?: options;
    drop?: values[];
    input?(pickup: ReturnType<typeof makeFloor>["pickup"]): input;
    allowExitProcess?: boolean;
};
export type processExec<values extends string, input extends {}, options extends {}> = {
    options?: options;
    pickup?: values[];
    input?: (pickup: ReturnType<typeof makeFloor>["pickup"]) => input;
};
export type processFunction = (request: Request, response: Response, options: any, input: any) => Promise<void> | void;
export interface builderProcess<addHook extends (...args: any) => any> {
    hook(name: Parameters<addHook>[0], hookFunction: Parameters<addHook>[1]): builderProcess<addHook>;
    extract(extractObj: extractObj, error?: errorExtract): Omit<builderProcess<addHook>, "hook" | "extract">;
    check(checker: returnCheckerExec | shortChecker): Omit<builderProcess<addHook>, "hook" | "extract">;
    process(returnProcessExec: returnProcessExec): Omit<builderProcess<addHook>, "hook" | "extract">;
    handler(handlerFunction: handlerFunction): Omit<builderProcess<addHook>, "hook" | "extract" | "check" | "process" | "handler">;
    build: ReturnType<ReturnType<typeof makeProcessSystem>["createProcess"]>["build"];
}
export type useProcess<values extends string, input extends {}, options extends {}> = {
    options?: options;
    pickup?: values[];
    input?: () => input;
};
export interface processUse<values extends string, input extends {}, options extends {}> {
    (processUse?: processExec<values, input, options>): returnProcessExec;
    use(request: Request, response: Response, processExec?: useProcess<values, input, options>): void | Promise<void>;
}
export type returnProcessExec = {
    name: string;
    options?: any;
    processFunction: processFunction;
    pickup?: string[];
    hooks: HookSystem["hooks"];
    type: string;
    input?: (pickup: ReturnType<typeof makeFloor>["pickup"]) => any;
};
export default function makeProcessSystem(): {
    createProcess: (name: string) => {
        hook: (name: "error" | "beforeSent" | "afterSent", hookFunction: (request: Request, response: Response, data?: any) => void | Promise<void>) => builderProcess<(name: "error" | "beforeSent" | "afterSent", hookFunction: (request: Request, response: Response, data?: any) => void | Promise<void>) => void>;
        extract: (extractObj: extractObj, error?: errorExtract | undefined) => Omit<builderProcess<(name: "error" | "beforeSent" | "afterSent", hookFunction: (request: Request, response: Response, data?: any) => void | Promise<void>) => void>, "hook" | "extract">;
        check: (checker: returnCheckerExec | shortChecker) => Omit<builderProcess<(name: "error" | "beforeSent" | "afterSent", hookFunction: (request: Request, response: Response, data?: any) => void | Promise<void>) => void>, "hook" | "extract">;
        handler: (handlerFunction: handlerFunction) => Omit<builderProcess<(name: "error" | "beforeSent" | "afterSent", hookFunction: (request: Request, response: Response, data?: any) => void | Promise<void>) => void>, "handler" | "hook" | "extract" | "check" | "process">;
        process: (returnProcessExec: returnProcessExec) => Omit<builderProcess<(name: "error" | "beforeSent" | "afterSent", hookFunction: (request: Request, response: Response, data?: any) => void | Promise<void>) => void>, "hook" | "extract">;
        build: <values extends string, input extends {}, options extends {}>(processBuild?: processBuild<values, input, options> | undefined) => processUse<values, input, options>;
    };
};
