import { DecodeOptions, SignOptions, VerifyOptions } from "jsonwebtoken";
import { ZodType, ZodTypeDef } from "zod";
declare namespace Token {
    type objCreateToken<output = any, def extends ZodTypeDef = ZodTypeDef, input = output> = {
        key: string;
        content: ZodType<output, def, input>;
        options?: {
            generate?: SignOptions;
            verify?: VerifyOptions;
            read?: DecodeOptions;
        };
    };
    export function create<zo, ze extends ZodTypeDef = ZodTypeDef, zi = zo>(name: string, objCreateToken: objCreateToken<zo, ze, zi>): {
        generate(content: zo): string;
        verify(token: string): zo | false;
        read(token: string): zo | false;
        refresh(token: string): string | false;
    };
    export {};
}
export default Token;
