import {zod} from "../scripts";
import {duplo} from ".";
import {userExist} from "./checker";
import {getUser} from "./process";
import "./abstractRoute";
import {RequestTest} from "./abstractRoute";

duplo.declareRoute("GET", "/user/{userId}")
.hook("onConstructRequest", () => console.log("local hook"))
.access(
	getUser,
	{
		pickup: ["user"]
	}
)
.extract({
	params: {
		userId: zod.coerce.number()
	}
})
.check(
	userExist,
	{
		input: (pickup) => pickup("userId"),
		validate: (info) => info === "user.exist",
		catch: (response, info) => response.code(404).info(info).send(),
		options: {type: "id"}
	}
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

duplo.declareRoute<RequestTest>("POST", "/user")
.access((floor, request) => {request.cookies;})
.extract({
	body: {
		firstname: zod.string().min(5).max(50),
		lastname: zod.string().min(5).max(50),
		age: zod.number(),
		pseudo: zod.string().min(5).max(50),
	}
})
.check(
	userExist,
	{
		input: (pickup) => pickup("firstname"),
		validate: (info) => info === "user.notexist",
		catch: (response, info) => response.code(403).info(info).send(),
		output: () => console.log("output"),
		options: {type: "firstname"}
	}
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
