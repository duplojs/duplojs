import {condition, mapped} from ".";

export const abstractRouteFunctionString = (hasOptions: boolean, block: string, returnArray: string[]) => /* js */`
(
	${(/await/.test(block) ? "async " : "")}function(request, response, options){
		/* first_line */
		/* end_block */
		const floor = this.makeFloor();
		let result;
		${hasOptions ? /* js */"floor.drop(\"options\", options);" : ""}
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
