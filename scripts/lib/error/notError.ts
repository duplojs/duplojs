export class NotError extends Error{
	constructor(message = "Something that is not an error interrupted the code."){
		super(message);
	}
}
