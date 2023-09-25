import {zod} from "../scripts";
import {duplo} from ".";
import {userExist} from "./checker";
import {getUser} from "./process";
import "./abstractRoute";
import "./skip";
import "./custom";
import "./functionOptions";

duplo.declareRoute("GET", "/user/{userId}")
.hook("onConstructRequest", () => console.log("local hook"))
.access(
	getUser,
	{
		pickup: ["user"],
	}
)
.extract({
	params: {
		userId: zod.coerce.number(),
	},
	headers: {
		"user-agent": zod.string()
	}
})
.check(
	userExist,
	{
		input: (pickup) => pickup("userId"),
		validate: (info, data) => info === "user.exist",
		catch: (response, info, data) => response.code(404).info(info).send(),
		options: {type: "id", test: "eeeeee"}
	}
)
.cut(({pickup}) => {
	console.log(pickup("user-agent"));
	
	if(!!true) return {
		obj: {hello: "world"}
	};
})
.custom((floor, request, response) => {
	console.log(floor, request, response);
	
})
.handler(({pickup}, response) => {
	response.code(200).send({
		obj: pickup("obj"),
		user: pickup("user")
	});
});

duplo.declareRoute("POST", "/user")
.access((floor, request) => {
	return {
		yoyo: 55
	};
})
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
		output: (drop, info, data) => console.log("output"),
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

duplo.declareRoute("GET", "/return/number")
.handler((floor, response) => {
	response.code(200).send(23);
});

duplo.declareRoute("GET", "/redirect")
.handler((floor, response) => {
	response.redirect("/return/number");
});


duplo.declareRoute("GET", "/static/*")
.handler(async({}, response) => {
	console.log("test");
	response.send("test");
});
