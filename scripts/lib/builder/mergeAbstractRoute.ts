import {ExtractObject} from "../duplose";
import {AbstractRouteInstance} from "../duplose/abstractRoute/instance";
import {ExtendsMergeAbstractRoute} from "../duplose/abstractRoute/merge";
import {SubAbstractRoute} from "../duplose/abstractRoute/sub";
import {ServerHooksLifeCycle} from "../hook";
import {Request} from "../request";
import {Response} from "../response";
import {AbstractRoutes} from "../system/abstractRoute";
import {UnionToIntersection} from "../utils";

export default function makeMergeAbstractRouteBuilder(
	serverHooksLifeCycle: ServerHooksLifeCycle,
	MergeAbstractRoute: typeof ExtendsMergeAbstractRoute,
	abstractRoutes: AbstractRoutes,
){
	function mergeAbstractRoute<
		abstractRouteInstance extends AbstractRouteInstance,
		request extends Request =(
			abstractRouteInstance extends AbstractRouteInstance<any, infer request>
				? request 
				: never
		),
		response extends Response = (
			abstractRouteInstance extends AbstractRouteInstance<any, any, infer response>
				? response 
				: never
		),
		extractObj extends ExtractObject = (
			abstractRouteInstance extends AbstractRouteInstance<any, any, any, infer extractObj>
				? extractObj 
				: never
		),
		floorValues extends {} = (
			abstractRouteInstance extends AbstractRouteInstance<any, any, any, any, infer floorValues>
				? floorValues
				: never
		),
		mergeFloor extends {} = (
			UnionToIntersection<floorValues> extends {} 
				? UnionToIntersection<floorValues>
				: {}
		)
	>(
		abstractRouteInstances: abstractRouteInstance[],
		...desc: any[]
	): AbstractRouteInstance<
		SubAbstractRoute,
		UnionToIntersection<request> extends Request ? UnionToIntersection<request> : never,
		UnionToIntersection<response> extends Response ? UnionToIntersection<response> : never,
		UnionToIntersection<extractObj> extends ExtractObject ? UnionToIntersection<extractObj> : never,
		mergeFloor
	>
	{	
		const currentMergeAbstractRoute = new MergeAbstractRoute(
			abstractRouteInstances.map(ari => ari.subAbstractRoute)
		);

		abstractRoutes.push(currentMergeAbstractRoute);
		serverHooksLifeCycle.onDeclareAbstractRoute.launchSubscriber(currentMergeAbstractRoute);

		return currentMergeAbstractRoute.createInstance(desc) as any;
	}

	return {
		mergeAbstractRoute
	};
}
