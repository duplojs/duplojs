import {duplo} from ".";
import {ReturnCheckerType, zod} from "../scripts";
import {userExist} from "./checker";

const mustBeConnected = duplo.declareAbstractRoute("mustBeConnected", {options: {t: 1}, prefix: "test"})
.hook("onConstructRequest", (request) => console.log("abstract hook"))
.access((floor, request, response) => {
	return {
		tt: "ee"
	};
})
.extract({})
.cut((floor, response) => {
	return {
		test: floor.pickup("options")
	};
})
.build(["test", "tt"]);

const deepAbstractRoute = mustBeConnected({pickup: ["test"], options: {t: 5}, ignorePrefix: true})
.declareAbstractRoute("deepAbstractRoute", {options: {lolo: "test"}})
.hook("onConstructRequest", () => console.log("deep abstract hook"))
.access((floor, request, response) => {
	floor.pickup("test");
})
.extract({
	query: {
		base: zod.string()
	}
})
.check<{user: ReturnCheckerType<typeof userExist>}, typeof userExist>(
	userExist,
	{
		input: (pickup) => pickup("base"),
		validate: (info, data) => info === "user.exist",
		catch: (response, info, data) => response.code(404).info(info).send(),
		output: (drop, info, data) => drop("user", data),
		options: {type: "id"}
	}
)
.cut((floor) => ({deep: "deep ABS"}))
.build(["user", "deep", "test"]);

deepAbstractRoute({pickup: ["user", "deep", "test"], ignorePrefix: true})
.declareRoute("GET", "/api")
.hook("onConstructRequest", () => console.log("local hook"))
.access((floor, request, response) => {
	return {
		tttt: floor.pickup("test"),
		user: floor.pickup("user")
	};
})
.extract({})
.handler((floor, response) => {
	const options = floor.pickup("user");
	response.code(200).info("test").send(options);
});
