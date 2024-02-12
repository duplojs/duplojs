import {DuploConfig, DuploInstance} from "../../../scripts/index";
import {Abstract10, Abstract11, Abstract2, Abstract5, Abstract6, Abstract9} from "../abstractRoute/abstractRoute";

export const MergeAbstractRoute1 = (duplo: DuploInstance<DuploConfig>) => {
	const abstract5 = Abstract5(duplo);
	const abstract6 = Abstract6(duplo);
	const abstract9 = Abstract9(duplo);

	const abstractInstance5 = abstract5();
	const abstractInstance6 = abstract6({pickup: ["test", "toto"]});
	const abstractInstance9 = abstract9({pickup: ["yyy"]});

	const mergedAbstractRoute = duplo.mergeAbstractRoute([
		abstractInstance5,
		abstractInstance6,
		abstractInstance9,
	]);

	return mergedAbstractRoute;
};

export const MergeAbstractRoute2 = (duplo: DuploInstance<DuploConfig>) => {
	const abstract2 = Abstract2(duplo);
	const abstract5 = Abstract5(duplo);

	return duplo.mergeAbstractRoute([
		abstract2({options: {test1: 82}}),
		abstract5(),
	]);
};

export const MergeAbstractRoute3 = (duplo: DuploInstance<DuploConfig>) => {
	const abstract11 = Abstract11(duplo);
	const abstract10 = Abstract10(duplo);

	const abstractInstance11 = abstract11();
	const abstractInstance10 = abstract10();

	const mergedAbstractRoute = duplo.mergeAbstractRoute([
		abstractInstance11,
		abstractInstance10
	]);

	return mergedAbstractRoute;
};
