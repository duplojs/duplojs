import {AbstractRoute} from "../../../mocks/duplose/abstractRoute";
import {MergeAbstractRoute} from "../../../mocks/duplose/abstractRoute/merge";
import {SubAbstractRoute} from "../../../mocks/duplose/abstractRoute/sub";

describe("sub abstract route", () => {
	it("parent abstract Route", () => {
		const abstractRoute = new AbstractRoute("test", undefined, []);
		const subAbstractRoute = new SubAbstractRoute(abstractRoute, {pickup: ["test"], options: {test: "value"}}, []);

		subAbstractRoute.build();

		expect(subAbstractRoute.pickup).toEqual(["test"]);
		expect(subAbstractRoute.options).toEqual({test: "value"});
		expect(subAbstractRoute.hooksLifeCyle).toEqual(abstractRoute.hooksLifeCyle);
	});

	it("parent merge abstract Route", () => {
		const abstractRoute1 = new AbstractRoute("test", undefined, []);
		const subAbstractRoute1 = new SubAbstractRoute(abstractRoute1, {pickup: ["test"], options: {test: "value"}}, []);
		subAbstractRoute1.build();
		
		const abstractRoute = new MergeAbstractRoute([subAbstractRoute1]);
		abstractRoute.build();
		const subAbstractRoute = new SubAbstractRoute(abstractRoute, {}, []);

		subAbstractRoute.build();

		expect(subAbstractRoute.pickup).toEqual(["test"]);
	});
});
