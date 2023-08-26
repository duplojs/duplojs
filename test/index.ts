import Duplo, {zod} from "../scripts/index";
import {DuploInputFunction} from "../scripts/lib/main";

export const duplo = Duplo({port: 1506, host: "0.0.0.0"});

duplo.setNotfoundHandler((request, response) => {
	response.code(200).send("notfound");
});

duplo.setErrorHandler((request, response, error) => {
	response.code(500).info("error").send(error.stack);
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

duplo.addHook("onConstructRequest", (request) => console.log("global hook"));

duplo.addHook("onDeclareRoute", route => {
	if(route.abstractRoute)console.log(route);
});

const useTest: DuploInputFunction<{test: number}> = (instance, con) => (1);

let a = duplo.use(useTest);

import("./route").then(() => duplo.launch());
