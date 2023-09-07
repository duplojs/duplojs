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
		options: 1
	}
);

const funcOptionsProcess = duplo.createProcess("funcOptionsProcess")
.cut(({pickup}) => {
	console.log("process : " + pickup("options"));
})
.build({options: 1});


duplo.declareRoute("GET", "/func/options/{number}")
.extract({
	params: {
		number: zod.coerce.number()
	}
})
.check(
	funcOptionsCheker,
	{
		input: () => {},
		validate: () => true,
		catch: (response) => response.code(500).info("wtf").send(),
		options: 2,
	}
)
.process(
	funcOptionsProcess, 
	{
		options: 2
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
		options: (pickup) => pickup("number"),
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
