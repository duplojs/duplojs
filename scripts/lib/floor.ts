export interface Floor{
	pickup<returnType = any>(index: string): returnType;
	drop(index: string, value: any): void;
}

export default function makeFloor(): Floor
{
	const floor: Record<string, any> = new Map();

	return {
		pickup: (index) => floor.get(index),
		drop: (index, value) => {floor.set(index, value);}
	};
}
