import {Process, makeProcessSystem} from "../../../../scripts";
import {makeMokedResponse, trySend} from "../../mocks/response";

it("systeme process", () => {
	const ps = makeProcessSystem({} as any, {} as any);
	const p = new ps.Process("test", []);
	expect(p).instanceof(Process);
	expect(p.config).toEqual({});
	expect(ps.createProcess).toBeTypeOf("function");
	expect(ps.processes).toEqual([]);

	const {response} = makeMokedResponse();
	trySend(() => {
		ps.Process.editableProperty.defaultErrorExtract(response, "body", "key", {} as any);
	});
	

	const f = () => {};
	ps.setDefaultErrorExtract(f);

	expect(ps.Process.editableProperty.defaultErrorExtract).toBe(f);
});
