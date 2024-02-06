export abstract class Step<_parent = unknown>{
	constructor(
		public name: string,
		public parent: _parent,
	){}
}
