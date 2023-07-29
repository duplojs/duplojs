import { Request } from "./request";
import makeFloor from "./floor";
import { Response } from "./response";
import { ZodError, ZodType } from "zod";
import { returnCheckerExec, shortChecker } from "./checker";
import { HookSystem } from "./hook";
import { anotherbackConfig } from "./main";
import { returnProcessExec } from "./process";
export type extractObj = {
    body?: Record<string, ZodType> | ZodType;
    params?: Record<string, ZodType> | ZodType;
    query?: Record<string, ZodType> | ZodType;
    cookies?: Record<string, ZodType> | ZodType;
    headers?: Record<string, ZodType> | ZodType;
};
export type errorExtract = (response: Response, type: keyof extractObj, index: string, err: ZodError) => void;
export type routesObject = Record<Request["method"], Record<string, (request: Request, response: Response) => Promise<void> | void>>;
export type handlerFunction = (floor: {
    pickup: ReturnType<typeof makeFloor>["pickup"];
    drop: ReturnType<typeof makeFloor>["drop"];
}, response: Response) => void;
export type notfoundHandlerFunction = (request: Request, response: Response) => void;
export type hook<addHook extends (...args: any) => any> = (name: Parameters<addHook>[0], hookFunction: Parameters<addHook>[1]) => {
    hook: hook<addHook>;
    extract: extract;
    handler: handler;
    check: check;
    process: process;
};
export type extract = (extractObj: extractObj, error?: errorExtract) => {
    handler: handler;
    check: check;
    process: process;
};
export type check = (checker: returnCheckerExec | shortChecker) => {
    handler: handler;
    check: check;
    process: process;
};
export type process = (returnProcessExec: returnProcessExec) => {
    handler: handler;
    check: check;
    process: process;
};
export type handler = (handlerFunction: handlerFunction) => void;
export default function makeRoutesSystem(config: anotherbackConfig, mainHooks: HookSystem["hooks"]): {
    declareRoute(method: Request["method"], path: string): {
        extract: extract;
        check: check;
        handler: handler;
        hook: hook<(name: "error" | "beforeSent" | "afterSent", hookFunction: (request: Request, response: Response, data?: any) => void | Promise<void>) => void>;
        process: process;
    };
    setNotfoundHandler(notFoundFunction: notfoundHandlerFunction): void;
    buildRoute(): void;
    findRoute(method: Request["method"], path: string): {
        notfoundFunction: notfoundHandlerFunction;
        routeFunction?: undefined;
        params?: undefined;
    } | {
        routeFunction: (request: Request, response: Response) => void | Promise<void>;
        params: Record<string, string>;
        notfoundFunction?: undefined;
    };
    routes: routesObject;
    buildedRoutes: Record<string, (path: string) => {
        path: string;
        params: Record<string, string>;
    }>;
};
