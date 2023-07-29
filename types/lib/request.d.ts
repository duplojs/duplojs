/// <reference types="node" />
import { IncomingHttpHeaders, IncomingMessage } from "http";
import { anotherbackConfig } from "./main";
export interface Request {
    readonly rawRequest: InstanceType<typeof IncomingMessage>;
    readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
    getHeader(key: string): undefined | string | string[];
    getHeaders(): IncomingHttpHeaders;
    url: string;
    host: string;
    origin: string;
    path: string;
    query: Record<string, string>;
    params: Record<string, string>;
    body?: unknown;
    cookies: Record<string, string>;
}
export default function makeRequest(request: Request["rawRequest"], config: anotherbackConfig): Request;
