import {duplo} from ".";
import {zod} from "../scripts";
import {ProcessExtractObj} from "../scripts/lib/process";
import Request from "../scripts/lib/request";
import Response from "../scripts/lib/response";

export interface ResponseTest extends Response{
	cookies: string;
}

interface textEx extends ProcessExtractObj{
	key?: string;
}

export const getUser = duplo.createProcess<Request, ResponseTest, textEx>("getUser")
.extract({
	params: {
		userId: zod.coerce.number(),
	},
})
.cut((floor, response, exitProcess) => {
	// exitProcess();
	floor.drop("user", {username: "paul"});
})
.build({allowExitProcess: true, drop: ["user"]});
