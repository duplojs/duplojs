import {Checker, Floor, buildDuplose, correctPath, deleteDescriptions, deleteEditingDuploseFunctions, makeFloor, pathToStringRegExp} from "../../../scripts";
import {AbstractRoute} from "../mocks/duplose/abstractRoute";
import {Process} from "../mocks/duplose/process";
import {Route} from "../mocks/duplose/route";

describe("utile", () => {
	it("build duplose", () => {
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
		const abss = [new AbstractRoute("test", undefined, [])];
		const processes = [new Process("test", [])];
		buildDuplose(routes, processes, abss);

		expect(routes.GET[0].stringDuploseFunction !== "").toBe(true);
		expect(processes[0].stringDuploseFunction !== "").toBe(true);
		expect(abss[0].stringDuploseFunction !== "").toBe(true);
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

	it("deleteEditingDuploseFunctions", () => {
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

		routes.GET[0].editingDuploseFunctions.push(() => {});
		processes[0].editingDuploseFunctions.push(() => {});
		abss[0].editingDuploseFunctions.push(() => {});

		deleteEditingDuploseFunctions(routes, processes, abss);

		expect(routes.GET[0].editingDuploseFunctions).toEqual([]);
		expect(processes[0].editingDuploseFunctions).toEqual([]);
		expect(abss[0].editingDuploseFunctions).toEqual([]);
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

