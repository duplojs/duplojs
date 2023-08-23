import {duplo} from ".";

export const userExist = duplo.createChecker(
	"userExist",
	{
		async handler(value: number, output, options){
			if(options.type === "id"){
				if(value !== 1) return output("user.notexist");
				else return output("user.exist", {name: "math", id: value});
			}
			else if(options.type === "firstname") return output("user.notexist");
			else return output("user.notexist");
		},
		outputInfo: ["user.exist", "user.notexist"],
		options: {type: "id" as "id" | "firstname"}
	}
);

export const userHasRight = duplo.createChecker(
	"userHasRight",
	{
		async handler(userId: any, output, options){
			return output("user.hasRight");
		},
		outputInfo: ["user.hasRight", "user.forbbiden"],
		options: {type: "id" as "id" | "firstname"}
	}
);
