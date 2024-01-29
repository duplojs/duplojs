import {matchRoute, routerStringFunction} from "../../../../scripts/lib/stringBuilder/router";

describe("string build router", () => {
	it("routerStringFunction", () => {
		const test = routerStringFunction("");

		expect(test).toBeTypeOf("string");
	});

	it("matchRoute", () => {
		const test = matchRoute("/gg/", 1, "/gg");

		expect(test.includes("result = /gg/.exec(path);")).toBe(true);
		expect(test.includes("this.routes[1]")).toBe(true);
		expect(test.includes("matchedPath: \"/gg\"")).toBe(true);
	});
});
