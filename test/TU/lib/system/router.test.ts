import {CutStep, makeRouterSystem} from "../../../../scripts";
import {Route} from "../../mocks/duplose/route";
import {makeMokedRequest} from "../../mocks/request";
import {makeMokedResponse} from "../../mocks/response";

it("systeme router", async() => {
	const {response} = makeMokedResponse();
	const {request} = makeMokedRequest({url: "/", method: "GET", matchedPath: "/"});

	const routes = {GET: [] as Route[]};
	const rs = makeRouterSystem({prefix: ""} as any, Route, routes as any);
	rs.buildRouter();
	
	const result = rs.findRoute("DELETE", "");
	expect(result.matchedPath).toBe(null);
	expect(result.params).toEqual({});
	expect(result.routeFunction).toBeTypeOf("function");
	await result.routeFunction(request, response);

	//test notfound handler is launch
	expect(response.status).toBe(404);
	expect(response.headers.info).toBe("NOTFOUND");
	expect(response.body).toBe("GET:/ not found");

	let testPass = false;
	const f = () => {testPass = true;};
	rs.setNotfoundHandler(f);

	rs.buildRouter();
	await result.routeFunction(request, response);
	expect(testPass).toBe(true);

	routes.GET.push(new Route("GET", ["/{id}"], undefined, []));	
	rs.buildRouter();

	const t = rs.findRoute("GET", "/15");
	expect(t.matchedPath).toBe("/{id}");
	expect(t.params).toEqual({id: "15"});
	await t.routeFunction(request, response);
	
});
