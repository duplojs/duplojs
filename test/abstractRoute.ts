import {duplo} from ".";
import {Request, Response, zod} from "../scripts";
import {userExist} from "./checker";

const mustBeConnected = duplo.declareAbstractRoute("mustBeConnected", {options: {t: 1}, prefix: "test"})
.hook("beforeRouteExecution", () => console.log("abstract hook beforeRouteExecution"))
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
.hook("beforeRouteExecution", () => console.log("deep abstract hook beforeRouteExecution"))
.access((floor, request, response) => {
	floor.pickup("test");
	console.log(floor.pickup("options"), floor.pickup("test"));
})
.extract({
	query: {
		id: zod.coerce.number()
	}
})
.process(
	duplo.createProcess("beforeRouteExecution")
	.hook("beforeRouteExecution", () => console.log("process hook beforeRouteExecution"))
	.build()
)
.check<typeof userExist, "user", "user.exist">(
	userExist,
	{
		input: pickup => pickup("id"),
		validate: info => info === "user.exist",
		catch: (response, info, data) => response.code(404).info(info).send(),
		output: (drop, info, data) => drop("user", data),
		options: {type: "id"}
	}
)
.cut((floor) => ({deep: "deep ABS"}))
.custom((floor, request, response) => {
	console.log(floor, request instanceof Request, response instanceof Response);
})
.build(["user", "deep", "test"]);

deepAbstractRoute({pickup: ["user", "deep", "test"]})
.declareRoute("GET", "/api")
.hook("beforeRouteExecution", () => console.log("local hook beforeRouteExecution"))
.access((floor, request, response) => {
	return {
		tttt: floor.pickup("test"),
		usser: floor.pickup("user")
	};
})
.extract({})
.handler((floor, response) => {
	const options = floor.pickup("usser");
	response.code(200).info("test").send(options);
});

const testAbstractRoute1 = duplo.declareAbstractRoute("testAbstractRoute1")
.hook("beforeRouteExecution", () => console.log("merge hook beforeRouteExecution"))
.extract({
	headers: {
		headerTesr: zod.number().optional(),
	}
})
.cut(({pickup}) => ({returnTest1: pickup("headerTesr")}))
.build(["returnTest1"]);

const testAbstractRoute1Instance = testAbstractRoute1({pickup: ["returnTest1"]});

testAbstractRoute1Instance.declareRoute("GET", "/test1")
.extract({
	query: {
		test: zod.string().optional()
	}
})
.cut(({pickup}) => ({
	pick: {
		test: pickup("test"),
		returnTest1: pickup("returnTest1"),
	}
}))
.handler(({pickup}, response) => response.send(pickup("pick")));

const testDeepAbstractRoute1Instance = deepAbstractRoute({pickup: ["user"]});

const testMerge = duplo.mergeAbstractRoute(
	[
		testAbstractRoute1Instance,
		testDeepAbstractRoute1Instance,
	]
);

testMerge
.declareRoute("GET", "/merge/test")
.extract({
	query: {
		testQuery1: zod.string().optional()
	}
})
.cut(({pickup}) => ({
	pick: {
		user: pickup("user"),
		returnTest1: pickup("returnTest1"),
	}
}))
.handler(({pickup}, response) => response.send(pickup("pick")));
