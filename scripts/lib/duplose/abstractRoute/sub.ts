import {AbstractRoute, AbstractRouteFunction} from ".";
import {MergeAbstractRoute} from "./merge";

export interface SubAbstractRouteParams<
	_drop extends string = any, 
	_pickup extends string = any, 
	_options extends any = any,
>{
	pickup?: [_drop, ..._drop[]] & [_pickup, ..._pickup[]]; 
	options?: Partial<_options>;
}

export abstract class SubAbstractRoute<
	_floor extends {} = {},
>{
	public get hooksLifeCyle(){
		return this.parent.hooksLifeCyle;
	}
	public duploseFunction: AbstractRouteFunction; 
	pickup: string[] = [];
	options: Record<string, any> = {};


	constructor(
		public parent: AbstractRoute | MergeAbstractRoute,
		public params: SubAbstractRouteParams,
		public desc: any[],
	){
		this.duploseFunction = this.parent.duploseFunction;
	}

	build(){
		this.duploseFunction = this.parent.duploseFunction;
		
		if(this.parent instanceof MergeAbstractRoute){
			this.pickup = this.parent.pickup;
		}
		else {
			this.pickup = this.params.pickup || [];
		}
		this.options = {
			...this.parent.options,
			...this.params.options
		};
	}
}

//@ts-ignore
export class ExtendsSubAbstractRoute extends SubAbstractRoute{}
