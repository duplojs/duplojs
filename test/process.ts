import {duplo} from ".";
import {zod} from "../scripts";
import {ProcessExtractObj} from "../scripts/lib/process";
import {Request} from "../scripts/lib/request";
import {Response} from "../scripts/lib/response";

export interface ResponseTest extends Response{
	cookies: string;
}

interface textEx extends ProcessExtractObj{
	key?: string;
}

export const getUser = duplo.createProcess<Request, ResponseTest, textEx>("getUser", {input: () => 1})
.extract({
	params: {
		userId: zod.coerce.number(),
	},
})
.cut<{user: {username: "paul"}}>((floor, response, exitProcess) => {
	// exitProcess();
	const test = floor.pickup("input");
	floor.drop("user", {username: "paul"});
})
.build({allowExitProcess: true, drop: ["user"]});
