import {ExtractObject} from "../duplose";
import {AbstractRouteInstance} from "../duplose/abstractRoute/instance";
import {ExtendsMergeAbstractRoute} from "../duplose/abstractRoute/merge";
import {SubAbstractRoute} from "../duplose/abstractRoute/sub";
import {ServerHooksLifeCycle} from "../hook";
import {Request} from "../request";
import {Response} from "../response";
import {AbstractRoutes} from "../system/abstractRoute";
import {UnionToIntersection} from "../utile";
import {DeclareAbstractRoute} from "./abstractRoute";
import {DeclareRoute} from "./route";

export default function makeMergeAbstractRouteBuilder(
	serverHooksLifeCycle: ServerHooksLifeCycle,
	MergeAbstractRoute: typeof ExtendsMergeAbstractRoute,
	declareRoute: DeclareRoute, 
	declareAbstractRoute: DeclareAbstractRoute, 
	abstractRoutes: AbstractRoutes,
){
	function mergeAbstractRoute<
		abstractRouteInstance extends AbstractRouteInstance,
		request extends abstractRouteInstance extends AbstractRouteInstance<infer request>? request : never,
		response extends abstractRouteInstance extends AbstractRouteInstance<any, infer response>? response : never,
		extractObj extends abstractRouteInstance extends AbstractRouteInstance<any, any, infer extractObj>? extractObj : never,
		floor extends abstractRouteInstance extends AbstractRouteInstance<any, any, any, any, infer floor>? floor : never
	>(
		abstractRouteInstances: AbstractRouteInstance[],
		...desc: any[]
	): AbstractRouteInstance<
		SubAbstractRoute<UnionToIntersection<floor> extends {}? UnionToIntersection<floor> : never>,
		UnionToIntersection<request> extends Request? UnionToIntersection<request> : never,
		UnionToIntersection<response> extends Response? UnionToIntersection<response> : never,
		UnionToIntersection<extractObj> extends ExtractObject? UnionToIntersection<extractObj> : never
	>
	{	
		const currentMergeAbstractRoute = new MergeAbstractRoute(
			abstractRouteInstances.map(ari => ari.subAbstractRoute)
		);
		
		abstractRoutes.push(currentMergeAbstractRoute);
		serverHooksLifeCycle.onDeclareAbstractRoute.syncLaunchSubscriber(currentMergeAbstractRoute);

		return currentMergeAbstractRoute.createInstance(desc) as any;
	}

	return {
		mergeAbstractRoute
	};
}
