import {duplo} from ".";
import {Request, Response} from "../scripts";

const custom = duplo.createProcess("custom")
.custom((floor, request, response, exit) => {
	console.log(request instanceof Request, response instanceof Response);
	
})
.build();

duplo.declareRoute("GET", "/custom")
.process(custom)
.handler((floor, response) => {
	response.code(200).send("suce");
});
