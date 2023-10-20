import chalk from "chalk";

(async() => {
	let numberError = 0;
	numberError += await (await import("./checker")).default;
	numberError += await (await import("./process")).default;
	numberError += await (await import("./abstractRoute")).default;
	numberError += await (await import("./mergeAbstractRoute")).default;
	if(numberError !== 0) throw numberError + " " + chalk.redBright("Errors");
})();

// route.stringFunction = route.stringFunction.replace(
// 	/\/\* first_line \*\/([^]*)/,
// 	(match, g1) => {
// 		const [block, afterBlock] = g1.split(/\/\* end_block \*\/([^]*)/s);
// 		return `
// 			/* first_line */
// 			${block}
// 			console.log("test injection", request.path, this.extends.myIndex);
// 			/* end_block */
// 			${afterBlock}
// 		`;
// 	}
// );
