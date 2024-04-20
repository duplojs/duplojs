import {ExtractObject} from "..";
import {BuilderPatternAbstractRoute} from "../../builder/abstractRoute";
import {BuilderPatternRoute,} from "../../builder/route";
import {Request, HttpMethods} from "../../request";
import {Response} from "../../response";
import {SubAbstractRoute} from "./sub";

export abstract class AbstractRouteInstance<
	_subAbstractRoute extends SubAbstractRoute = SubAbstractRoute,
	request extends Request = Request,
	response extends Response = Response,
	extractObj extends ExtractObject = ExtractObject,
	floorValues extends {} = {},
>{
	abstract declareRoute<
		req extends Request = request, 
		res extends Response = response,
		extObj extends ExtractObject = ExtractObject,
	>(method: HttpMethods, path: string | string[], ...desc: any[]): BuilderPatternRoute<request & req, response & res, extractObj & extObj, floorValues>;
	abstract declareAbstractRoute<
		req extends Request = request, 
		res extends Response = response,
		extObj extends ExtractObject = ExtractObject,
	>(name: string, ...desc: any[]): BuilderPatternAbstractRoute<request & req, response & res, extractObj & extObj, never, floorValues>;

	constructor(
		public subAbstractRoute: _subAbstractRoute,
	){}
}

//@ts-ignore
export class ExtendsAbstractRouteInstance extends AbstractRouteInstance{}
