import {AbstractRoute} from "../../../mocks/duplose/abstractRoute";
import {AbstractRouteInstance} from "../../../mocks/duplose/abstractRoute/instance";
import {SubAbstractRoute} from "../../../mocks/duplose/abstractRoute/sub";

it("abstract instance construct", () => {
	const abstractRoute = new AbstractRoute("test", undefined, ["test"]);
	const subAbstractRoute = new SubAbstractRoute(abstractRoute, {}, []);
	const abstractRouteInstance = new AbstractRouteInstance(subAbstractRoute);

	expect(abstractRouteInstance.subAbstractRoute).toBe(subAbstractRoute);
});
