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
		options: 10
	}
);

const skipProcessBis = duplo.createProcess("skipProcess", {options: 1})
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
		skip: zod.string().containBool
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
		skip: (pickup) => pickup("skip"),
	},
)
.process(
	skipProcessBis,
	{skip: (pickup) => pickup("skip"), options: 10, pickup: ["zoumba"]}
)
.cut(({pickup}) => {
	pickup("zoumba");
})
.build();

duplo.declareRoute("GET", "/test/skip/{bool}")
.extract({
	params: {
		bool: zod.string().containBool
	}
})
.check(
	skipCheker,
	{
		input: () => {},
		validate: () => true,
		catch: (response) => response.code(500).info("wtf").send(),
		skip: (pickup) => pickup("bool"),
	}
)
.process(
	skipProcess, 
	{
		skip: (pickup) => pickup("bool"), 
		input: (pickup) => pickup("bool")
	}
)
.handler(({pickup}, response) => {
	response.code(200).send("test");
});

