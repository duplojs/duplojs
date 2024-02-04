import {AbstractRoute, AbstractRouteInstance, MergeAbstractRoute, SubAbstractRoute, makeAbstractRouteBuilder, makeAbstractRouteSystem} from "../../../../scripts";
import {makeMokedResponse, trySend} from "../../mocks/response";

vi.mock("../../../../scripts/lib/builder/abstractRoute", () => ({
	makeAbstractRouteBuilder: () => ({declareAbstractRoute: () => {}})
}));

it("systeme abstract route", () => {
	const ars = makeAbstractRouteSystem({} as any, {} as any, (() => {}) as any);

	const aaa = new ars.AbstractRoute("test", undefined, []);
	expect(new ars.SubAbstractRoute({} as any, {}, [])).instanceof(SubAbstractRoute);
	expect(aaa).instanceof(AbstractRoute);
	expect(aaa.config).toEqual({});
	expect(aaa.SubAbstractRoute).toBe(ars.SubAbstractRoute);
	expect(aaa.AbstractRouteInstance).toBe(ars.AbstractRouteInstance);

	const aaaa = new ars.AbstractRouteInstance({} as any);
	expect(aaaa).instanceof(AbstractRouteInstance);
	aaaa.declareAbstractRoute("");
	aaaa.declareRoute("DELETE", []);

	const aa = new ars.MergeAbstractRoute([]);
	expect(aa).instanceof(MergeAbstractRoute);
	expect(aa.config).toEqual({});
	expect(aa.SubAbstractRoute).toBe(ars.SubAbstractRoute);
	expect(aa.AbstractRouteInstance).toBe(ars.AbstractRouteInstance);

	const {response} = makeMokedResponse();
	trySend(() => {
		ars.AbstractRoute.editableProperty.defaultErrorExtract(response, "body", "key", {} as any);
	});

	const f = () => {};
	ars.setDefaultErrorExtract(f);
	expect(ars.AbstractRoute.editableProperty.defaultErrorExtract).toBe(f);
});
