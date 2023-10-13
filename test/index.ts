import Duplo, {zod, Request, DuploInstance} from "../scripts/index";

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

duplo
.addHook("beforeRouteExecution", (request) => console.log("global hook beforeRouteExecution"))
.addHook("onDeclareRoute", route => {
	if(route.descs.length !== 0){
		// console.log(route.stringFunction);
		// console.log(route.path, route.descs);
		route.extends.myIndex = 3;
		route.stringFunction = route.stringFunction.replace(
			/\/\* first_line \*\/([^]*)/,
			(match, g1) => {
				const [block, afterBlock] = g1.split(/\/\* end_block \*\/([^]*)/s);
				return `
					/* first_line */
					${block}
					console.log("test injection", request.path, this.extends.myIndex);
					/* end_block */
					${afterBlock}
				`;
			}
		);
		route.build();
	}
});

let a = duplo.use((test, options: {lala: 1}) => options, {lala: 1});

import("./route").then(() => duplo.launch());
