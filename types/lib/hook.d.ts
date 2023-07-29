import { Request } from "./request";
import { Response } from "./response";
type hookFunction<data = any> = (request: Request, response: Response, data?: data) => void | Promise<void>;
export default function makeHooksSystem<event extends string>(eventsName: event[]): {
    addHook(name: event, hookFunction: hookFunction<any>): void;
    buildHooks(): void;
    launchHooks(name: event, request: Request, response: Response, data?: any): void | Promise<void>;
    copyHook(otherHooks: Record<string, hookFunction<any>[]>, from: string, to: event): void;
    hooks: Record<string, hookFunction<any>[]>;
    buildedHooks: Record<string, hookFunction<any>>;
};
export type HookSystem = ReturnType<typeof makeHooksSystem>;
export {};
