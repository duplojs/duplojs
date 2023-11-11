import {DuploConfig, DuploInstance} from "../../scripts/index";
import {Abstract2, Abstract5, Abstract6, Abstract7, Abstract8, Abstract9} from "../abstractRoute/abstractRoute";

export const MergeAbstractRoute1 = (duplo: DuploInstance<DuploConfig>) => {
	
	const abstract5 = Abstract5(duplo);
	const abstract6 = Abstract6(duplo);
	const abstract9 = Abstract9(duplo);

	return duplo.mergeAbstractRoute([
		abstract6({pickup: ["test", "toto"]}),
		abstract9({pickup: ["yyy"]}),
		abstract5(),
	]);
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
	const abstract7 = Abstract7(duplo);
	const abstract8 = Abstract8(duplo);

	return duplo.mergeAbstractRoute([
		abstract7({ignorePrefix: true}),
		abstract8(),
	]);
};
