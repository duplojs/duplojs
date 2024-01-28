import {Checker} from "../../../../scripts";
import makeCheckerSystem from "../../../../scripts/lib/system/checker";

it("systeme checker", () => {
	const cs = makeCheckerSystem({} as any);
	
	expect(new cs.Checker("test", [])).instanceof(Checker);
	expect(cs.createChecker).toBeTypeOf("function");
	expect(cs.checkers).toEqual({});
});
