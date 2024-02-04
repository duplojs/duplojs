import {Route, makeRouteSystem} from "../../../../scripts";
import {makeMokedResponse, trySend} from "../../mocks/response";

it("systeme route", () => {
	const rs = makeRouteSystem({} as any, {} as any, {} as any);
	const r = new rs.Route("GET", [],  undefined, []);
	expect(r).instanceof(Route);
	expect(r.config).toEqual({});
	expect(r.errorHandlerFunction).toBeTypeOf("function");
	expect(rs.declareRoute).toBeTypeOf("function");

	const {response} = makeMokedResponse();
	trySend(() => {
		rs.Route.editableProperty.defaultErrorExtract(response, "body", "key", {} as any);
	});
	response.isSend = false;
	trySend(() => {
		rs.Route.editableProperty.errorHandlerFunction({} as any, response, new Error());
	});

	const f = () => {};
	rs.setDefaultErrorExtract(f);
	rs.setErrorHandler(f);

	expect(rs.Route.editableProperty.defaultErrorExtract).toBe(f);
	expect(rs.Route.editableProperty.errorHandlerFunction).toBe(f);
});
