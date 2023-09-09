import {duplo} from ".";
import {ReturnCheckerType} from "../scripts";

export const userExist = duplo.createChecker(
	"userExist",
	{
		async handler(value: number | string, output, options){
			if(options.type === "id"){
				if(value !== 1) return output("user.notexist", undefined);
				else return output("user.exist", {name: "math", id: value});
			}
			else if(options.type === "firstname") return output("user.notexist", undefined);
			else return output("user.notexist", undefined);
		},
		outputInfo: ["user.exist", "user.notexist"],
		options: {type: "id" as "id" | "firstname"},
	}
);

type test1 = ReturnCheckerType<typeof userExist>


export const userHasRight = duplo.createChecker(
	"userHasRight",
	{
		async handler(userId: any, output, options){
			if(userId) return output("user.forbbiden", "test");
			else return output("user.forbbiden", 1);
		},
		outputInfo: ["user.hasRight", "user.forbbiden"],
		options: {type: "id" as "id" | "firstname"}
	}
);

type test = ReturnCheckerType<typeof userHasRight>


