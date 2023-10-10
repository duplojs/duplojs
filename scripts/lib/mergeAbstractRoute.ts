import {AbstractRoute, AbstractRouteInstance, DeclareAbstractRoute, __abstractRoute__} from "./abstractRoute";
import {makeHooksLifeCycle} from "./hook";
import {Request} from "./request";
import {DeclareRoute, RouteExtractObj, condition, mapped} from "./route";
import makeFloor from "./floor";
import {UnionToIntersection} from "./utility";
import {Response} from "./response";

export default function makeMergeAbstractRoutesSystem(declareRoute: DeclareRoute, declareAbstractRoute: DeclareAbstractRoute){
	function mergeAbstractRoute<
		abstractRouteInstance extends AbstractRouteInstance,
		request extends abstractRouteInstance extends AbstractRouteInstance<infer request>? request : never,
		response extends abstractRouteInstance extends AbstractRouteInstance<any, infer response>? response : never,
		extractObj extends abstractRouteInstance extends AbstractRouteInstance<any, any, infer extractObj>? extractObj : never,
		floor extends abstractRouteInstance extends AbstractRouteInstance<any, any, any, any, infer floor>? floor : never
	>(
		abstractRouteInstances: abstractRouteInstance[],
	): AbstractRouteInstance<
		UnionToIntersection<request> extends Request? UnionToIntersection<request> : never,
		UnionToIntersection<response> extends Response? UnionToIntersection<response> : never,
		UnionToIntersection<extractObj> extends RouteExtractObj? UnionToIntersection<extractObj> : never,
		Record<string, any>, 
		UnionToIntersection<floor> extends {}? UnionToIntersection<floor> : never
	>
	{
		const hooksLifeCyle = makeHooksLifeCycle();
		const pickup: string[] = [];

		abstractRouteInstances.forEach(ari => {
			hooksLifeCyle.onConstructRequest.copySubscriber(ari[__abstractRoute__].hooksLifeCyle.onConstructRequest.subscribers);
			hooksLifeCyle.onConstructResponse.copySubscriber(ari[__abstractRoute__].hooksLifeCyle.onConstructResponse.subscribers);
			hooksLifeCyle.beforeRouteExecution.copySubscriber(ari[__abstractRoute__].hooksLifeCyle.beforeRouteExecution.subscribers);
			hooksLifeCyle.beforeParsingBody.copySubscriber(ari[__abstractRoute__].hooksLifeCyle.beforeParsingBody.subscribers);
			hooksLifeCyle.onError.copySubscriber(ari[__abstractRoute__].hooksLifeCyle.onError.subscribers);
			hooksLifeCyle.beforeSend.copySubscriber(ari[__abstractRoute__].hooksLifeCyle.beforeSend.subscribers);
			hooksLifeCyle.afterSend.copySubscriber(ari[__abstractRoute__].hooksLifeCyle.afterSend.subscribers);

			pickup.push(...ari[__abstractRoute__].pickup);
		});

		const stringFunction = mergeAbstractRouteFunctionString(
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

		const abstractRouteFunction = eval(stringFunction).bind({
			abstractRoutes: abstractRouteInstances.map(ari => ari[__abstractRoute__]),
			makeFloor,
		});

		const mapAbstractRouteSubscribers = abstractRouteInstances.map(ari => ari[__abstractRoute__].abstractRouteSubscribers).flat();

		const abstractRouteParams: AbstractRoute = {
			abstractRouteFunction,
			hooksLifeCyle,
			name: `merge(${mapAbstractRouteSubscribers.map(ars => ars.name).join(",")})`,
			prefix: "",
			pickup: pickup,
			options: {},
			abstractRouteSubscribers: mapAbstractRouteSubscribers,
		};

		return {
			declareRoute: (method: Request["method"], path: string) => declareRoute(method, path, abstractRouteParams),
			declareAbstractRoute: (nameAbstractRoute: string, optionsAbstractRoute: Record<string, any>) => declareAbstractRoute(nameAbstractRoute, optionsAbstractRoute, abstractRouteParams),
			[__abstractRoute__]: abstractRouteParams,
		} as any;
	}

	return {
		mergeAbstractRoute
	};
}

const mergeAbstractRouteFunctionString = (block: string, returnArray: string[]) => /* js */`
(
	${(/await/.test(block) ? "async " : "")}function(request, response, options){
		const floor = this.makeFloor();
		let result;

		${block}

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
result = ${async ? "await " : ""}this.abstractRoutes[${index}].abstractRouteFunction(
	request, 
	response, 
	this.abstractRoutes[${index}].options,
);

${drop}
`;

const processDrop = (key: string) => /* js */`
floor.drop("${key}", result["${key}"]);
`;
