export const routeFunctionString = (
	async: boolean, 
	hasHookOnConstructRequest: boolean, 
	hasHookOnConstructResponse: boolean,
	hasHookBeforeRouteExecution: boolean,
	hasHookOnError: boolean,
	hasHookBeforeSend: boolean,
	hasHookAfterSend: boolean,
	block: string, 
) => /* js */`
(
	async function(request, response){
		/* first_line */
		/* end_block */

		/* before_hook_on_construct_request */
		/* end_block */
		${hasHookOnConstructRequest ? "await this.hooks.launchOnConstructRequest(request);" : ""}
		/* after_hook_on_construct_request */
		/* end_block */

		/* before_hook_on_construct_response */
		/* end_block */
		${hasHookOnConstructResponse ? "await this.hooks.launchOnConstructResponse(response);" : ""}
		/* after_hook_on_construct_response */
		/* end_block */

		try {
			/* first_line_first_try */
			/* end_block */
			try{
				/* first_line_second_try */
				/* end_block */

				/* before_hook_before_route_execution */
				/* end_block */
				${hasHookBeforeRouteExecution ? "await this.hooks.launchBeforeRouteExecution(request, response);" : ""}
				/* after_hook_before_route_execution */
				/* end_block */
				const floor = this.makeFloor();
				let result;
				/* after_make_floor */
				/* end_block */
				${block}
				/* before_handler */
				/* end_block */
				${async ? "await " : ""}this.handler(floor, response);
				/* before_no_respose_sent */
				/* end_block */
				response.code(503).info("NO_RESPONSE_SENT").send();
			}
			catch(error){
				/* first_line_second_catch */
				/* end_block */
				if(error instanceof Error){
					/* before_hook_on_error */
					/* end_block */
					${hasHookOnError ? "await this.hooks.launchOnError(request, response, error);" : ""}
					/* after_hook_on_error */
					/* end_block */
					this.errorHandlerFunction(request, response, error);
				}
				else throw error;
			}
		}
		catch(response){
			/* first_line_first_catch */
			/* end_block */
			if(response instanceof this.Response){
				/* before_hook_before_send */
				/* end_block */
				${hasHookBeforeSend ? "await this.hooks.launchBeforeSend(request, response);" : ""}
				/* after_hook_before_send */
				/* end_block */

				/* before_write_head */
				/* end_block */
				response.rawResponse.writeHead(response.status, response.headers);
				/* after_write_head */
				/* end_block */

				/* before_hook_serialize_body */
				/* end_block */
				await this.hooks.launchSerializeBody(request, response);
				/* after_hook_serialize_body */
				/* end_block */

				/* before_close_response */
				/* end_block */
				if(response.rawResponse.writableEnded === false){
					response.rawResponse.end();
				}
				/* after_close_response */
				/* end_block */

				/* before_hook_after_send */
				/* end_block */
				${hasHookAfterSend ? "await this.hooks.launchAfterSend(request, response);" : ""}
				/* after_hook_after_send */
				/* end_block */
			}
			else throw response;
		}
	}
)
`;

export const subAbstractRouteString = (async: boolean, drop: string) => /* js */`
/* before_abstract_route */
/* end_block */
result = ${async ? "await " : ""}this.subAbstractRoute.duploseFunction(
	request, 
	response, 
	this.subAbstractRoute.options,
);
/* after_abstract_route */
/* end_block */
${drop}
/* after_drop_abstract_route */
/* end_block */
`;

export const hookBody = () => /* js */`
if(request.body === undefined){
	/* before_hook_before_parsing_body */
	/* end_block */
	await this.hooks.launchParsingBody(request, response);
	/* after_hook_before_parsing_body */
	/* end_block */
}
`;

export const extractedTry = (block: string) => /* js */`
/* before_extracted */
/* end_block */
let currentExtractedType;
let currentExtractedIndex;

try{
	/* first_line_extracted_try */
	/* end_block */
	${block}
}
catch(error) {
	/* first_line_extracted_catch */
	/* end_block */
	if(error instanceof this.ZodError)this.errorExtract(
		response, 
		currentExtractedType, 
		currentExtractedIndex, 
		error,
	);
	else throw error;
}
/* after_extracted */
/* end_block */
`;

export const extractedType = (type: string) => /* js */`
/* before_extracted_step_[${type}] */
/* end_block */
currentExtractedType = "${type}";
currentExtractedIndex = "";
floor.drop(
	"${type}",
	this.extracted["${type}"].parse(request["${type}"])
);
/* after_extracted_step_[${type}] */
/* end_block */
`;

export const extractedTypeKey = (type: string, key: string) => /* js */`
/* before_extracted_step_[${type}]_[${key}] */
/* end_block */
currentExtractedType = "${type}";
currentExtractedIndex = "${key}";
floor.drop(
	"${key}",
	this.extracted["${type}"]["${key}"].parse(request["${type}"]?.["${key}"])
);
/* after_extracted_step_[${type}]_[${key}] */
/* end_block */
`;

export const cutStep = (async: boolean, index: number, block: string) => /* js */`
/* before_step_[${index}] */
/* end_block */
result = ${async ? "await " : ""}this.steps[${index}].short(floor, response, request);
/* after_step_[${index}] */
/* end_block */
${block}
/* after_drop_step_[${index}] */
/* end_block */
`;

export const checkerStep = (async: boolean, index: number, hasResult: boolean, resultIsArray: boolean, hasIndexing: boolean, optionsIsFunction: boolean) => /* js */`
/* before_step_[${index}] */
/* end_block */
result = ${async ? "await " : ""}this.steps[${index}].handler(
	this.steps[${index}].input(floor.pickup),
	(info, data) => ({info, data}),
	${!optionsIsFunction ? /* js */`this.steps[${index}].options` : /* js */`this.steps[${index}].options(floor.pickup)`},
);
/* after_step_[${index}] */
/* end_block */
${hasResult && !resultIsArray ? /* js */`
if(this.steps[${index}].result !== result.info){
	this.steps[${index}].catch(
		response, 
		result.info, 
		result.data, 
		floor.pickup
	);
}` : ""}
${hasResult && resultIsArray ? /* js */`
if(!this.steps[${index}].result.includes(result.info)){
	this.steps[${index}].catch(
		response, 
		result.info, 
		result.data, 
		floor.pickup
	);
}` : ""}

${hasIndexing ? /* js */`floor.drop(this.steps[${index}].indexing, result.data)` : ""}
/* after_drop_step_[${index}] */
/* end_block */
`;

export const processStep = (async: boolean, index: number, hasInput: boolean, optionsIsFunction: boolean, drop: string) => /* js */`
/* before_step_[${index}] */
/* end_block */
result = ${async ? "await " : ""}this.steps[${index}].processFunction(
	request, 
	response, 
	${!optionsIsFunction ? /* js */`this.steps[${index}].options` : /* js */`this.steps[${index}].options(floor.pickup)`},
	${hasInput ? /* js */`this.steps[${index}].input(floor.pickup)` : ""}
);
/* after_step_[${index}] */
/* end_block */
${drop}
/* after_drop_step_[${index}] */
/* end_block */
`;

export const skipStep = (bool: boolean, index: number, block: string) => bool ? /* js */`
/* before_skip_step_[${index}] */
/* end_block */
if(!this.steps[${index}].skip(floor.pickup)){
	${block}
}
` : block;

export const processDrop = (key: string) => /* js */`
floor.drop("${key}", result["${key}"]);
`;
