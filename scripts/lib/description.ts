import {AbstractRoutes} from "./abstractRoute";
import {Checkers} from "./checker";
import {Processes} from "./process";
import {RoutesObject} from "./route";

export function deleteDescriptions(
	routes: RoutesObject,
	checkers: Checkers,
	processes: Processes,
	abstractRoutes: AbstractRoutes,
){
	Object.values(routes).forEach(
		method => Object.values(method).forEach(
			route => route.descs = []
		)
	);

	Object.values(checkers).forEach(
		checker => checker.desc = []
	);

	Object.values(processes).forEach(
		process => process.descs = []
	);

	Object.values(abstractRoutes).forEach(
		abstractRoute => abstractRoute.descs = []
	);
}
