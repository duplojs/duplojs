export class AlreadySent extends Error{
	constructor(message = "Response cannot interrupt code execution twice."){
		super(message);
	}
}
