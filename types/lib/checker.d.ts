import makeFloor from "./floor";
import { Response } from "./response";
type output<outputInfo> = {
    info: outputInfo;
    data?: any;
};
type outputChecker<outputInfo> = (info: outputInfo, data?: any) => output<outputInfo>;
export interface checkerObj<input, outputInfo, options> {
    handler(input: input, output: outputChecker<outputInfo>, options: options): output<outputInfo> | Promise<output<outputInfo>>;
    readonly outputInfo: outputInfo[];
    readonly options?: options;
}
export interface checkerExec<input, outputInfo, options> {
    input(pickup: ReturnType<typeof makeFloor>["pickup"]): input;
    validate(info: outputInfo, data?: any): boolean;
    catch(response: Response, info: outputInfo, data: any, existProcess: () => never): void;
    output?: (drop: ReturnType<typeof makeFloor>["drop"], data?: any) => void;
    readonly options?: options;
}
export interface useCheckerExec<input, outputInfo, options> {
    input(): input;
    validate(info: outputInfo, data?: any): boolean;
    catch: (info: outputInfo, data?: any) => void;
    output?: (data?: any) => void;
    readonly options?: options;
}
export type shortChecker = (floor: {
    pickup: ReturnType<typeof makeFloor>["pickup"];
    drop: ReturnType<typeof makeFloor>["drop"];
}, response: Response, existProcess: () => never) => void;
export type returnCheckerExec<input = any, outputInfo = string, options = any> = {
    name: string;
    handler: checkerObj<input, outputInfo, options>["handler"];
    options: checkerObj<input, outputInfo, options>["options"] | {};
    input: checkerExec<input, outputInfo, options>["input"];
    validate: checkerExec<input, outputInfo, options>["validate"];
    catch: checkerExec<input, outputInfo, options>["catch"];
    output: checkerExec<input, outputInfo, options>["output"];
    type: string;
};
export default function makeCheckerSystem(): {
    createChecker: <input extends unknown, outputInfo extends string, options>(name: string, checkerObj: checkerObj<input, outputInfo, options>) => {
        (checkerExec: checkerExec<input, outputInfo, options>): returnCheckerExec;
        use(checkerExec: useCheckerExec<input, outputInfo, options>): void;
        useAsync(checkerExec: useCheckerExec<input, outputInfo, options>): Promise<void>;
    };
};
export {};
