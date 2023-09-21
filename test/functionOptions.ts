import {duplo} from ".";
import {zod} from "../scripts";

const funcOptionsCheker = duplo.createChecker(
	"funcOptionsCheker",
	{
		async handler(value: any, output, options){
			console.log("checker : " + options);
			return output("notSkip", undefined);
			
		},
		outputInfo: ["notSkip"],
		options: {num: 1}
	}
);

const funcOptionsProcess = duplo.createProcess("funcOptionsProcess", {options: {num: 10}, input: () => ({test: 1})})
.extract({
	params: {
		test: zod.string().optional()
	}
})
.cut(({pickup}) => {
	pickup("test");
	console.log("process : " + pickup("options").num);
})
.build();


duplo.declareRoute("GET", "/func/options/{number}")
.extract({
	params: {
		number: zod.coerce.number()
	},
	cookie: {

	}
})
.check(
	funcOptionsCheker,
	{
		input: (pickup) => pickup("number"),
		validate: (info) => true,
		catch: (response) => response.code(500).info("wtf").send(),
		options: {num: 1},
	}
)
.process(
	funcOptionsProcess, 
	{
		options: {num: 1},
	}
)
.check(
	funcOptionsCheker,
	{
		input: () => {},
		validate: () => true,
		catch: (response) => response.code(500).info("wtf").send(),
		options: (pickup) => pickup("number"),
	}
)
.process(
	funcOptionsProcess, 
	{
		options: (pickup) => ({num: pickup("number")}),
	}
)
.check(
	funcOptionsCheker,
	{
		input: () => {},
		validate: () => true,
		catch: (response) => response.code(500).info("wtf").send(),
	}
)
.process(funcOptionsProcess)
.handler(({pickup}, response) => {
	response.code(200).send("test");
});
