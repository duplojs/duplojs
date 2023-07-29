/// <reference types="node" />
import { ServerResponse } from "http";
import { anotherbackConfig } from "./main";
import { CookieSerializeOptions } from "cookie";
export declare const __exec__: unique symbol;
export interface Response {
    readonly rawResponse: InstanceType<typeof ServerResponse>;
    code(status: number): Response;
    status: number;
    info(info: string): Response;
    send(data?: any): never | void;
    sendFile(path: string): never | void;
    download(path: string, name?: string): never | void;
    getHeaders(): Record<string, string>;
    getHeader(index: string): string;
    setHeaders(headers: Record<string, string>): Response;
    setHeader(index: string, value: string): Response;
    setCookie(name: string, value: string, params?: CookieSerializeOptions): Response;
    deleteCookie(name: string, params?: CookieSerializeOptions): Response;
    cookies: Record<string, {
        value: string;
        params: CookieSerializeOptions;
    }>;
    data?: any;
    file?: string;
    isSend: boolean;
    [__exec__](): void;
    [Symbol.hasInstance](instance: any): boolean;
}
export declare class ResponseInstance {
}
export default function makeResponse(response: Response["rawResponse"], config: anotherbackConfig): Response;
