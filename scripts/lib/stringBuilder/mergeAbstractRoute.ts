import {condition, mapped} from ".";

export const mergeAbstractRouteFunctionString = (block: string, returnArray: string[]) => /* js */`
(
	${(/await/.test(block) ? "async " : "")}function(request, response){
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
		/* last_line */
		/* end_block */
	}
)
`;

export const subAbstractRoutesString = (async: boolean, index: number, drop: string) => /* js */`
/* before_abstract_route_[${index}] */
/* end_block */
result = ${async ? "await " : ""}this.subAbstractRoutes[${index}].duploseFunction(
	request, 
	response, 
	this.subAbstractRoutes[${index}].options,
);
/* after_abstract_route_[${index}] */
/* end_block */
${drop}
/* after_drop_abstract_route_[${index}] */
/* end_block */
`;
