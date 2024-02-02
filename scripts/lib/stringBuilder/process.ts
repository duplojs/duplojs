import {condition, mapped} from ".";

export const processFunctionString = (hasInput: boolean, hasOptions: boolean, block: string, returnArray: string[]) => /* js */`
(
	${(/await/.test(block) ? "async " : "")}function(request, response, options, input){
		/* first_line */
		/* end_block */
		const floor = this.makeFloor();
		let result;
		${hasInput ? /* js */`floor.drop("input", ${"input"});` : ""}
		${hasOptions ? /* js */`floor.drop("options", ${"options"});` : ""}
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

export const handlerFunctionString = (async: boolean) => /* js */`
/* before_handler */
/* end_block */
${async ? "await " : ""}this.handler(floor, response);
`;
