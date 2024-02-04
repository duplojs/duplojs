export const routerStringFunction = (block: string) => /* js */`(
	function(path){
		let result;

		${block}

		return {
			routeFunction: this.notfoundHandlerFunction,
			params: {},
			matchedPath: null,
		};
	}
)`;

export const matchRoute = (regex: string, index: number, path: string) => /* js */`
result = ${regex}.exec(path);
if(result !== null) return {
	routeFunction: this.routes[${index}].duploseFunction,
	params: result.groups || {},
	matchedPath: "${path}",
};
`;
