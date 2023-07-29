import anotherback, {zod} from "../scripts/index";

const aob = anotherback({port: 1506, host: "0.0.0.0"});

aob.input((addHook) => {
	
});	

const monSuperChecker = aob.createChecker(
	"test",
	{
		handler(input: number, output){
			return output("user.exist");
		},
		outputInfo: ["user.exist", "user.notexist"],
		options: {test: "ok"}
	}
);

const testProcess2 = aob.createProcess("test2")
.extract({
	body: zod.string()
})
.check(
	monSuperChecker({
		input: () => 1,
		validate: () => false,
		catch: (response, info, data, existProcess) => existProcess()
	})
)
.handler(({drop, pickup}, response, existProcess) => {
	drop("test", 1);
	// console.log(pickup("input"));
	// response.code(204).info("good").send();
})
.build({
	drop: ["test"], 
	options: {ok: 44}, 
	input: () => 222, 
	allowExitProcess: true
});

const testProcess = aob.createProcess("test")
.check((floor, response, existProcess) => {})
.process(
	testProcess2(
		{
			pickup: ["test"], 
			options: {ok: 55}, 
			input: () => 22,
		}
	)
)
.handler((floor, response) => {
	// console.log(floor.pickup("test"));
})
.build({drop: ["test"]});

aob.declareRoute("POST", "/")
// .hook("afterSent", () => console.log("test"))
// .extract(
// 	{
// 		// params: {
// 		// 	id: zod.coerce.number(),
// 		// },
// 		body: zod.string(),
// 	}
// )
.process(testProcess({pickup: ["test"]}))
// .check(
// 	monSuperChecker({
// 		input: (pickup) => pickup("id"),
// 		validate: (info) => true,
// 		catch: (response) => response.code(403).info("nooo").send(),
// 		output: (drop, data) => {}
// 	})
// )
.handler((floor, response) => {
	console.log(floor.pickup("test"));
	response.code(204).info("good").send();
	
});

aob.declareRoute("GET", "/").handler((floor, response) => response.sendFile("./test/index.ts"));

aob.launch();
