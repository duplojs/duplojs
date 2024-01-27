import {AbstractRouteFunction} from ".";
import {DuploConfig} from "../../duploInstance";
import {Hook, HooksLifeCycle, makeHooksLifeCycle} from "../../hook";
import {Request} from "../../request";
import {Response} from "../../response";
import {mapped} from "../../stringBuilder";
import {mergeAbstractRouteFunctionString, subAbstractRoutesString} from "../../stringBuilder/mergeAbstractRoute";
import {processDrop} from "../../stringBuilder/route";
import {AnyFunction, DescriptionAll, makeFloor} from "../../utile";
import {ExtendsAbstractRouteInstance} from "./instance";
import {ExtendsSubAbstractRoute, SubAbstractRoute} from "./sub";

export type EditingFunctionMergeAbstractRoute = (mergeAbstractRoute: MergeAbstractRoute) => void;

export abstract class MergeAbstractRoute{
	public name: string;
	public hooksLifeCyle: HooksLifeCycle<Request, Response> = makeHooksLifeCycle();
	public pickup: string[] = [];
	public options = undefined;
	public children: SubAbstractRoute[] = [];

	abstract get SubAbstractRoute(): typeof ExtendsSubAbstractRoute;
	abstract get AbstractRouteInstance(): typeof ExtendsAbstractRouteInstance;

	public descs: DescriptionAll[] = [];
	public duploseFunction: AbstractRouteFunction = () => ({}); 
	public extensions: Record<string, any> = {};
	public stringDuploseFunction: string = "";
	public editingDuploseFunctions: EditingFunctionMergeAbstractRoute[] = [];

	public abstract get config(): DuploConfig;

	constructor(
		public subAbstractRoutes: SubAbstractRoute[],
	){
		this.name = `@merge(${this.subAbstractRoutes.map(sar => sar.parent.name).join(",")})`;

		this.subAbstractRoutes.forEach(subAbstractRoute => {
			Object.keys(this.hooksLifeCyle).forEach((key) => {
				this.hooksLifeCyle[key].addSubscriber(
					subAbstractRoute.hooksLifeCyle[key] as Hook
				);
			});
		});
	}

	createInstance(desc: any[]){
		const sub = new this.SubAbstractRoute(this, {}, desc);
		this.children.push(sub);
		return new this.AbstractRouteInstance(sub);
	}

	build(){
		this.pickup = [];
		this.subAbstractRoutes.forEach(subAbstractRoute => {
			this.pickup.push(...subAbstractRoute.pickup);
		});
		
		this.stringDuploseFunction = mergeAbstractRouteFunctionString(
			mapped(
				this.subAbstractRoutes, 
				(subAbstractRoute, index) => subAbstractRoutesString(
					subAbstractRoute.duploseFunction.constructor.name === "AsyncFunction",
					index,
					mapped(
						subAbstractRoute.pickup,
						(value) => processDrop(value)
					)
				)
			),
			this.pickup
		);
		
		this.editingDuploseFunctions.forEach(editingFunction => editingFunction(this));

		this.duploseFunction = eval(this.stringDuploseFunction).bind({
			config: this.config,
			subAbstractRoutes: this.subAbstractRoutes,
			extensions: this.extensions,
			makeFloor,
		});

		this.children.forEach(child => child.build());
	}
}

//@ts-ignore
export class ExtendsMergeAbstractRoute extends MergeAbstractRoute{}
