import {AbstractRoute, AbstractRouteInstance, AbstractRoutes, DeclareAbstractRoute, __abstractRoute__} from "./abstractRoute";
import {ServerHooksLifeCycle, makeHooksLifeCycle} from "./hook";
import {Request} from "./request";
import {DeclareRoute, RouteExtractObj, condition, mapped} from "./route";
import makeFloor from "./floor";
import {UnionToIntersection} from "./utility";
import {Response} from "./response";

export default function makeMergeAbstractRoutesSystem(
	declareRoute: DeclareRoute, 
	declareAbstractRoute: DeclareAbstractRoute, 
	serverHooksLifeCycle: ServerHooksLifeCycle, 
	allAbstractRoutes: AbstractRoutes,
){
	function mergeAbstractRoute<
		abstractRouteInstance extends AbstractRouteInstance,
		request extends abstractRouteInstance extends AbstractRouteInstance<infer request>? request : never,
		response extends abstractRouteInstance extends AbstractRouteInstance<any, infer response>? response : never,
		extractObj extends abstractRouteInstance extends AbstractRouteInstance<any, any, infer extractObj>? extractObj : never,
		floor extends abstractRouteInstance extends AbstractRouteInstance<any, any, any, any, infer floor>? floor : never
	>(
		abstractRouteInstances: abstractRouteInstance[],
		...desc: any[]
	): AbstractRouteInstance<
		UnionToIntersection<request> extends Request? UnionToIntersection<request> : never,
		UnionToIntersection<response> extends Response? UnionToIntersection<response> : never,
		UnionToIntersection<extractObj> extends RouteExtractObj? UnionToIntersection<extractObj> : never,
		Record<string, any>, 
		UnionToIntersection<floor> extends {}? UnionToIntersection<floor> : never
	>
	{
		const abstractRoutes = abstractRouteInstances.map(ari => ari[__abstractRoute__]);
		const hooksLifeCyle = makeHooksLifeCycle();
		const pickup: string[] = [];
		const fullPrefix: string[] = [];

		abstractRoutes.forEach(ar => {
			hooksLifeCyle.onConstructRequest.copySubscriber(ar.hooksLifeCyle.onConstructRequest.subscribers);
			hooksLifeCyle.onConstructResponse.copySubscriber(ar.hooksLifeCyle.onConstructResponse.subscribers);
			hooksLifeCyle.beforeRouteExecution.copySubscriber(ar.hooksLifeCyle.beforeRouteExecution.subscribers);
			hooksLifeCyle.beforeParsingBody.copySubscriber(ar.hooksLifeCyle.beforeParsingBody.subscribers);
			hooksLifeCyle.onError.copySubscriber(ar.hooksLifeCyle.onError.subscribers);
			hooksLifeCyle.beforeSend.copySubscriber(ar.hooksLifeCyle.beforeSend.subscribers);
			hooksLifeCyle.afterSend.copySubscriber(ar.hooksLifeCyle.afterSend.subscribers);

			pickup.push(...ar.pickup);
			fullPrefix.push(ar.fullPrefix);
		});

		const abstractRoute: AbstractRoute = {
			name: `@merge{${abstractRoutes.map(ar => ar.name).join(",")}}`,
			localPrefix: "",
			fullPrefix: fullPrefix.join(""),
			drop: pickup,
			pickup: pickup,
			options: {},
			allowExitProcess: false,
			hooksLifeCyle,
			mergeAbstractRoute: abstractRoutes,
			extracted: {},
			errorExtract: () => {},
			steps: [],
			abstractRouteFunction: () => ({}),
			params: {},
			descs: desc.length !== 0 ? [{type: "abstract", descStep: desc}] : [],
			extends: {},
			stringFunction: "",
			editingFunctions: [],
			build: () => {
				abstractRoute.stringFunction = mergeAbstractRouteFunctionString(
					mapped(
						abstractRouteInstances, 
						(value, index) => abstractRoutesString(
							value[__abstractRoute__].abstractRouteFunction.constructor.name === "AsyncFunction",
							index,
							mapped(
								value[__abstractRoute__].pickup,
								(value) => processDrop(value)
							)
						)
					),
					pickup
				);
		
				abstractRoute.editingFunctions.forEach(editingFunction => editingFunction(abstractRoute));

				abstractRoute.abstractRouteFunction = eval(abstractRoute.stringFunction).bind({
					abstractRoutes: abstractRoute.mergeAbstractRoute,
					extends: abstractRoute.extends,
					makeFloor,
				});
			}
		};

		abstractRoute.build();
		allAbstractRoutes[abstractRoute.name] = abstractRoute;
		serverHooksLifeCycle.onDeclareAbstractRoute.syncLaunchSubscriber(abstractRoute);

		return {
			declareRoute: (method: Request["method"], path: string, ...desc: any[]) => declareRoute(method, path, abstractRoute, ...desc),
			declareAbstractRoute: (nameAbstractRoute: string, optionsAbstractRoute: Record<string, any>, ...desc: any[]) => declareAbstractRoute(nameAbstractRoute, optionsAbstractRoute, abstractRoute, ...desc),
			[__abstractRoute__]: abstractRoute,
		} as any;
	}

	return {
		mergeAbstractRoute
	};
}

const mergeAbstractRouteFunctionString = (block: string, returnArray: string[]) => /* js */`
(
	${(/await/.test(block) ? "async " : "")}function(request, response, options){
		/* first_line */
		/* end_block */
		const floor = this.makeFloor();
		let result;
		/* after_make_floor */
		/* end_block */
		${block}
		/* before_return */
		/* end_block */
	${condition(
		returnArray.length !== 0,
		() => /* js */`
		return {
			${mapped(returnArray, (key) => /* js */`"${key}": floor.pickup("${key}"),`)}
		}
		`
	)}
	}
)
`;

const abstractRoutesString = (async: boolean, index: number, drop: string) => /* js */`
/* before_abstract_route_[${index}] */
/* end_block */
result = ${async ? "await " : ""}this.abstractRoutes[${index}].abstractRouteFunction(
	request, 
	response, 
	this.abstractRoutes[${index}].options,
);
/* after_abstract_route_[${index}] */
/* end_block */
${drop}
/* after_drop_abstract_route_[${index}] */
/* end_block */
`;

const processDrop = (key: string) => /* js */`
floor.drop("${key}", result["${key}"]);
`;
