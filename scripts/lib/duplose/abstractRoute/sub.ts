import {AbstractRoute, AbstractRouteFunction} from ".";

export interface SubAbstractRouteParams<
	_drop extends string = any, 
	_pickup extends string = any, 
	_options extends any = any,
>{
	pickup?: [_drop, ..._drop[]] & [_pickup, ..._pickup[]]; 
	options?: Partial<_options>;
}

export class SubAbstractRoute<
	_options extends Record<string, any> = any,
	_floor extends {} = {},
>{
	public get hooksLifeCyle(){
		return this.subAbstractRoute.hooksLifeCyle;
	}
	public duploseFunction: AbstractRouteFunction; 
	pickup: string[] = [];
	options: Record<string, any> = {};


	constructor(
		public subAbstractRoute: AbstractRoute,
		public params: SubAbstractRouteParams,
		public desc: any[],
	){
		this.duploseFunction = this.subAbstractRoute.duploseFunction;
	}

	build(){
		this.duploseFunction = this.subAbstractRoute.duploseFunction;
		this.pickup = this.params.pickup || [];
		this.options = {
			...this.subAbstractRoute.options,
			...this.params.options
		};
	}
}
