export interface Floor<floor extends {}>{
	pickup<key extends Exclude<keyof floor, symbol>>(index: key): floor[key];
	// pickup<key extends keyof floor>(index: string): any;
	drop<key extends Exclude<keyof floor, symbol>>(index: key, value: floor[key]): void;
	// drop(index: string, value: any): void;
}

export default function makeFloor(): Floor<{}>
{
	const floor: Record<string, any> = new Map();

	return {
		pickup: (index) => floor.get(index),
		drop: (index, value) => {floor.set(index, value);}
	};
}
