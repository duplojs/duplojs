import {zod} from "../scripts";
import {duplo} from ".";

const skipCheker = duplo.createChecker(
	"skipCheker",
	{
		async handler(value: any, output, options){
			console.log("not skip checker");
			return output("notSkip", undefined);
			
		},
		outputInfo: ["notSkip"],
		options: {num: 10}
	}
);

const skipProcessBis = duplo.createProcess("skipProcess", {options: {num: 1}})
.cut(() => {
	console.log("not skip process");
	return {
		zoumba: 2
	};
})
.build(["zoumba"]);

const skipProcess = duplo.createProcess("skipProcess")
.extract({
	query: {
		skip: zod.string()
	}
})
.cut(() => {
	console.log("not skip process");
})
.check(
	skipCheker,
	{
		input: () => {},
		validate: () => true,
		catch: (response) => response.code(500).info("wtf").send(),
		skip: (pickup) => pickup("skip") === "true",
	},
)
.process(
	skipProcessBis,
	{skip: (pickup) => pickup("skip") === "true", options: {num: 33}, pickup: ["zoumba"]}
)
.cut(({pickup}) => {
	pickup("zoumba");
})
.build();

duplo.declareRoute("GET", "/test/skip/{bool}")
.extract({
	params: {
		bool: zod.string()
	}
})
.check(
	skipCheker,
	{
		input: () => {},
		validate: () => true,
		catch: (response) => response.code(500).info("wtf").send(),
		skip: (pickup) => pickup("bool") === "true",
	}
)
.process(
	skipProcess, 
	{
		skip: (pickup) => pickup("bool") === "true", 
		input: (pickup) => pickup("bool")
	}
)
.handler(({pickup}, response) => {
	response.code(200).send("test");
});

