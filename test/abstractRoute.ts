import {duplo} from ".";
import {Request} from "../scripts/lib/request";
import {Response} from "../scripts/lib/response";
import {RouteExtractObj} from "../scripts/lib/route";

export interface RequestTest extends Request{
	cookies: string;
}

export interface RequestTest2 extends Request{
	toto: string;
}

export interface RequestTest3 extends Request{
	aa: string;
}

interface textEx extends RouteExtractObj{
	key?: string;
}

const mustBeConnected = duplo.declareAbstractRoute<RequestTest, Response, textEx>("mustBeConnected")
.hook("onConstructRequest", (request) => console.log("abstract hook"))
.access((floor, request, response) => {request.cookies;})
.extract({})
.cut((floor, response) => {
	floor.drop("test", floor.pickup("options"));
})
.build({
	drop: ["test"], 
	options: {test: true},
	prefix: "test"
});

const deepAbstractRoute = mustBeConnected({pickup: ["test"], options: {test: false}, ignorePrefix: true})
.declareAbstractRoute<RequestTest2>("deepAbstractRoute")
.hook("onConstructRequest", () => console.log("deep abstract hook"))
.access((floor, request, response) => {
	request.cookies;
	request.toto;
})
.extract({})
.cut((floor) => floor.drop("deep", "deep ABS"))
.build({drop: ["test", "deep"], prefix: "deep"});

deepAbstractRoute({pickup: ["test", "deep"], ignorePrefix: true})
.declareRoute<RequestTest3>("GET", "/api")
.hook("onConstructRequest", () => console.log("local hook"))
.access((floor, request, response) => {request.cookies;})
.extract({})
.handler((floor, response) => {
	const options = floor.pickup("test");
	options.deep = floor.pickup("deep");
	response.code(200).info("test").send(options);
});
