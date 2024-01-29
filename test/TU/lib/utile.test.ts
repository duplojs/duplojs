import {Checker, Floor, buildAbstractRoutes, buildProcesses, buildRoutes, correctPath, deepFreeze, deleteDescriptions, makeFloor, pathToStringRegExp} from "../../../scripts";
import {AbstractRoute} from "../mocks/duplose/abstractRoute";
import {Process} from "../mocks/duplose/process";
import {Route} from "../mocks/duplose/route";

describe("utile", () => {
	it("deepFreeze", () => {
		const test = {test: {}};
		deepFreeze(test, 2);

		expect(Object.isFrozen(test)).toBe(true);
		expect(Object.isFrozen(test.test)).toBe(true);
	});

	it("buildRoutes", () => {
		const routes = {
			GET: [new Route("GET", ["/"], undefined, [])],
			POST: [],
			PATCH: [],
			PUT: [],
			HEAD: [],
			DELETE: [],
			OPTIONS: [],
		};
		routes.GET[0].handler = () => {};
		buildRoutes(routes);

		expect(routes.GET[0].stringDuploseFunction !== "").toBe(true);
	});

	it("buildAbstractRoutes", () => {
		const abss = [new AbstractRoute("test", undefined, [])];
		buildAbstractRoutes(abss);

		expect(abss[0].stringDuploseFunction !== "").toBe(true);

	});

	it("buildProcesses", () => {
		const processes = [new Process("test", [])];
		buildProcesses(processes);

		expect(processes[0].stringDuploseFunction !== "").toBe(true);
	});

	it("deleteDescriptions", () => {
		const routes = {
			GET: [new Route("GET", ["/"], undefined, ["test"])],
			POST: [],
			PATCH: [],
			PUT: [],
			HEAD: [],
			DELETE: [],
			OPTIONS: [],
		};
		const abss = [new AbstractRoute("test", undefined, ["test"])];
		const processes = [new Process("test", ["test"])];
		const checkers = [new Checker("test", ["test"])];
		deleteDescriptions(routes, checkers as any, processes, abss);

		expect(routes.GET[0].descs).toEqual([]);
		expect(processes[0].descs).toEqual([]);
		expect(checkers[0].descs).toEqual([]);
		expect(abss[0].descs).toEqual([]);
	});

	it("correctPath", () => {
		expect(correctPath("test/")).toBe("/test");
	});

	it("makeFloor", () => {
		const floor = makeFloor() as Floor<{test: number}>;

		floor.drop("test", 1);

		expect(floor.pickup("test")).toBe(1);
	});

	it("hasProp", () => {
		expect(Object.hasProp({test: 1}, "test")).toBe(true);
	});

	it("pathToStringRegExp", () => {
		expect(pathToStringRegExp("/test/{id}")).toBe("/^\\/test\\/(?<id>[a-zA-Z0-9_\\-]+)\\/?(?:\\?[^]*)?$/");
	});
});

