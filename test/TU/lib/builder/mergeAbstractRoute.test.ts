import {makeServerHooksLifeCycle} from "../../../../scripts";
import makeMergeAbstractRouteBuilder from "../../../../scripts/lib/builder/mergeAbstractRoute";
import {AbstractRoute} from "../../mocks/duplose/abstractRoute";
import {MergeAbstractRoute} from "../../mocks/duplose/abstractRoute/merge";

it("mergeAbstractRoute builder", () => {
	const {mergeAbstractRoute} = makeMergeAbstractRouteBuilder(makeServerHooksLifeCycle(), MergeAbstractRoute, []);

	const absr1 = new AbstractRoute("test", undefined, []);
	const absr2 = new AbstractRoute("test1", undefined, []);

	const mabsr = mergeAbstractRoute([
		absr1.createInstance({pickup: ["test", ""]}, ["test"]),
		absr2.createInstance({pickup: ["test", ""]}, ["test"]),
	], "test");
	
	expect((mabsr.subAbstractRoute.parent as MergeAbstractRoute).subAbstractRoutes.map(v => v.parent)).toEqual([
		absr1,
		absr2
	]);
	expect(mabsr.subAbstractRoute.desc).toEqual(["test"]);
});
