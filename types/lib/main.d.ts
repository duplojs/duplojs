/// <reference types="node" />
import http from "http";
import { HookSystem } from "./hook.ts";
export interface anotherbackConfig {
    port: number;
    host: string;
    callback?: () => void;
    prefix?: string;
}
export type inputOptions = Record<string, any>;
export type inputCallback<options extends inputOptions = Record<never, never>, addHook = HookSystem["addHook"]> = (addHook: addHook, options?: options) => void | Promise<void>;
export default function anotherback(config: anotherbackConfig): {
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    config: anotherbackConfig;
    launch(): http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    addHook: (name: "error" | "beforeSent" | "afterSent" | "init" | "serializeBody", hookFunction: (request: import("./request.ts").Request, response: import("./response.ts").Response, data?: any) => void | Promise<void>) => void;
    input<options extends inputOptions>(inputFunction: inputCallback<options, (name: "error" | "beforeSent" | "afterSent" | "init" | "serializeBody", hookFunction: (request: import("./request.ts").Request, response: import("./response.ts").Response, data?: any) => void | Promise<void>) => void>, options?: options | undefined): void | Promise<void>;
    declareRoute: (method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD", path: string) => {
        extract: import("./route.ts").extract;
        check: import("./route.ts").check;
        handler: import("./route.ts").handler;
        hook: import("./route.ts").hook<(name: "error" | "beforeSent" | "afterSent", hookFunction: (request: import("./request.ts").Request, response: import("./response.ts").Response, data?: any) => void | Promise<void>) => void>;
        process: import("./route.ts").process;
    };
    createChecker: <input extends unknown, outputInfo extends string, options_1>(name: string, checkerObj: import("./checker.ts").checkerObj<input, outputInfo, options_1>) => {
        (checkerExec: import("./checker.ts").checkerExec<input, outputInfo, options_1>): import("./checker.ts").returnCheckerExec<any, string, any>;
        use(checkerExec: import("./checker.ts").useCheckerExec<input, outputInfo, options_1>): void;
        useAsync(checkerExec: import("./checker.ts").useCheckerExec<input, outputInfo, options_1>): Promise<void>;
    };
    setNotfoundHandler: (notFoundFunction: import("./route.ts").notfoundHandlerFunction) => void;
    createProcess: (name: string) => {
        hook: (name: "error" | "beforeSent" | "afterSent", hookFunction: (request: import("./request.ts").Request, response: import("./response.ts").Response, data?: any) => void | Promise<void>) => import("./process.ts").builderProcess<(name: "error" | "beforeSent" | "afterSent", hookFunction: (request: import("./request.ts").Request, response: import("./response.ts").Response, data?: any) => void | Promise<void>) => void>;
        extract: (extractObj: import("./route.ts").extractObj, error?: import("./route.ts").errorExtract | undefined) => Omit<import("./process.ts").builderProcess<(name: "error" | "beforeSent" | "afterSent", hookFunction: (request: import("./request.ts").Request, response: import("./response.ts").Response, data?: any) => void | Promise<void>) => void>, "hook" | "extract">;
        check: (checker: import("./checker.ts").returnCheckerExec | import("./checker.ts").shortChecker) => Omit<import("./process.ts").builderProcess<(name: "error" | "beforeSent" | "afterSent", hookFunction: (request: import("./request.ts").Request, response: import("./response.ts").Response, data?: any) => void | Promise<void>) => void>, "hook" | "extract">;
        handler: (handlerFunction: import("./process.ts").handlerFunction) => Omit<import("./process.ts").builderProcess<(name: "error" | "beforeSent" | "afterSent", hookFunction: (request: import("./request.ts").Request, response: import("./response.ts").Response, data?: any) => void | Promise<void>) => void>, "handler" | "hook" | "extract" | "check" | "process">;
        process: (returnProcessExec: import("./process.ts").returnProcessExec) => Omit<import("./process.ts").builderProcess<(name: "error" | "beforeSent" | "afterSent", hookFunction: (request: import("./request.ts").Request, response: import("./response.ts").Response, data?: any) => void | Promise<void>) => void>, "hook" | "extract">;
        build: <values extends string, input_1 extends {}, options_2 extends {}>(processBuild?: import("./process.ts").processBuild<values, input_1, options_2> | undefined) => import("./process.ts").processUse<values, input_1, options_2>;
    };
};
