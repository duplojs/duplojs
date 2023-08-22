import {duplo} from ".";
import {zod} from "../scripts";

export const getUser = duplo.createProcess("getUser")
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
