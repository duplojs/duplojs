export default function makeFloor(){
	const floor: Record<string, any> = new Map();

	return {
		pickup: (index: string) => floor.get(index),
		drop: (index: string, value: any) => {floor.set(index, value);}
	};
}
