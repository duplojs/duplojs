import { Request } from "../request";
import { Response } from "../response";
export declare function bodyToText(request: Request, response: Response): Promise<void>;
export declare function textContentType(request: Request, response: Response): Promise<void>;
