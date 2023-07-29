import jwt, {DecodeOptions, SignOptions, VerifyOptions} from "jsonwebtoken";
import {ZodType, ZodTypeDef, z} from "zod";

namespace Token {
	type objCreateToken<output = any, def extends ZodTypeDef = ZodTypeDef, input = output> = {
		key: string,
		content: ZodType<output, def, input>,
		options?: {
			generate?: SignOptions,
			verify?: VerifyOptions,
			read?: DecodeOptions,
			// cookie?: CookieSerializeOptions,
		}
	};

	const list: Record<string, objCreateToken> = {};

	export function create<zo, ze extends ZodTypeDef = ZodTypeDef, zi = zo>(name: string, objCreateToken: objCreateToken<zo, ze, zi>){	
		list[name] = objCreateToken;

		return {
			generate(content: zo): string{
				objCreateToken.content.parse(content);
				return jwt.sign({content}, objCreateToken.key, objCreateToken.options?.generate);
			},
			verify(token: string): zo | false{
				try {
					const result = jwt.verify(token, objCreateToken.key, objCreateToken.options?.verify) as {content: zo};
					if(typeof result !== "object" || result.content === undefined) return false;
					return result.content;
				}
				catch {
					return false;
				}
			},
			read(token: string): zo | false{
				try {
					const result = jwt.decode(token, objCreateToken.options?.read) as {content: zo};
					if(typeof result !== "object" || result.content === undefined) return false;
					return result.content;
				}
				catch {
					return false;
				}
			},
			refresh(token: string): string | false{
				const result = this.read(token);
				if(result === false) return false;
				return this.generate(result);
			},
		};
	}
}

export default Token;
