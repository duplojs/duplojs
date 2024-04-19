import {makeHooksLifeCycle} from "../../../../../scripts";
import {AbstractRoute} from "../../../mocks/duplose/abstractRoute";
import {MergeAbstractRoute} from "../../../mocks/duplose/abstractRoute/merge";
import {SubAbstractRoute} from "../../../mocks/duplose/abstractRoute/sub";

describe("merge abstract route", () => {
	it("construct", () => {
		const abstractRoute1 = new AbstractRoute("test", undefined, []);
		const subAbstractRoute1 = new SubAbstractRoute(abstractRoute1, {pickup: ["test"], options: {test: "value"}}, []);
		subAbstractRoute1.build();
		
		const abstractRoute = new MergeAbstractRoute([subAbstractRoute1]);

		expect(abstractRoute.name).toBe("@merge(test)");
	});

	it("copy hook", () => {
		const abstractRoute1 = new AbstractRoute("test", undefined, []);
		const subAbstractRoute1 = new SubAbstractRoute(abstractRoute1, {pickup: ["test"], options: {test: "value"}}, []);
		subAbstractRoute1.build();
		
		const abstractRoute = new MergeAbstractRoute([subAbstractRoute1]);

		const localHooksLifeCycle = makeHooksLifeCycle();
		abstractRoute.copyHook(localHooksLifeCycle);

		expect(localHooksLifeCycle.afterSend.subscribers[0]).toBe(abstractRoute.hooksLifeCyle.afterSend.subscribers[0]);
	});

	it("create instance", () => {
		const abstractRoute1 = new AbstractRoute("test", undefined, []);
		const subAbstractRoute1 = new SubAbstractRoute(abstractRoute1, {pickup: ["test"], options: {test: "value"}}, []);
		subAbstractRoute1.build();
		
		const abstractRoute = new MergeAbstractRoute([subAbstractRoute1]);
		const instance = abstractRoute.createInstance([]);

		expect(instance.subAbstractRoute).toBe(abstractRoute.children[0]);
	});

	it("build", () => {
		const abstractRoute1 = new AbstractRoute("test", undefined, []);
		const subAbstractRoute1 = new SubAbstractRoute(abstractRoute1, {pickup: ["test"], options: {test: "value"}}, []);
		subAbstractRoute1.build();
		
		const abstractRoute = new MergeAbstractRoute([subAbstractRoute1]);
		const instance = abstractRoute.createInstance([]);
		abstractRoute.editingDuploseFunctions.push(() => {});

		abstractRoute.build();

		expect(abstractRoute.pickup).toEqual(["test"]);
	});
});
