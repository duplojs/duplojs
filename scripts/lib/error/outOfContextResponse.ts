export class OutOfContextResponse extends Error{
	constructor(message = "Response interrupted the code from its context."){
		super(message);
	}
}
