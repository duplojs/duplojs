export default function makeFloor(){

	const floor: Record<string, any> = {};

	function pickup(index: string){
		return floor[index];
	}

	function drop(index: string, value: any){
		floor[index] = value;
	}

	return {
		pickup,
		drop
	};
}
