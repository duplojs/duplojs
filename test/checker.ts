import {duplo} from ".";
import {zod} from "../scripts";

const userExist = duplo.createChecker(
	"userExist",
	{
		async handler(value: any, output, options){
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

duplo.declareRoute("GET", "/user/{userId}")
.extract({
	params: {
		userId: zod.coerce.number()
	}
})
.check(
	userExist({
		input: (pickup) => pickup("userId"),
		validate: (info) => info === "user.exist",
		catch: (response, info) => response.code(404).info(info).send(),
		output: (drop, info, data) => drop("user", data)
	})
)
.cut((floor) => {
	floor.drop("obj", {hello: "world"});
})
.handler((floor, response) => {
	response.code(200).send({
		obj: floor.pickup("obj"),
		user: floor.pickup("user")
	});
});

duplo.addContentTypeParsers(/json/, (request) => new Promise(
	(resolve, reject) => {
		let stringBody = "";
		request.rawRequest.on("error", reject);
		request.rawRequest.on("data", chunck => stringBody += chunck);
		request.rawRequest.on("end", () => {
			request.body = JSON.parse(stringBody);
			console.log("myParser");
			resolve();
		});
	}
));

duplo.declareRoute("POST", "/user")
.extract({
	body: {
		firstname: zod.string().min(5).max(50),
		lastname: zod.string().min(5).max(50),
		age: zod.number(),
		pseudo: zod.string().min(5).max(50),
	}
})
.check(
	userExist({
		input: (pickup) => pickup("firstname"),
		validate: (info) => info === "user.notexist",
		catch: (response, info) => response.code(403).info(info).send(),
		options: {type: "firstname"}
	})
)
.handler((floor, response) => {
	response.code(200).send({
		firstname: floor.pickup("firstname"),
		lastname: floor.pickup("lastname"),
		age: floor.pickup("age"),
		pseudo: floor.pickup("pseudo"),
	});
});

duplo.declareRoute("PATCH", "/article/{articleId}")
.extract({
	params: {
		articleId: zod.coerce.number(),
	},
	body: zod.string().min(10).max(1500),
})
.handler((floor, response) => {
	response.code(200).send(floor.pickup("body"));
});
