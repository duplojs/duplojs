declare global {
	interface ObjectConstructor {
		entries<anyObject extends object>(o: anyObject): Array<
			Exclude<
				{
					[p in keyof anyObject]: [p, anyObject[p]] 
				}[keyof anyObject],
				undefined
			>
		>;
		keys<anyObject extends object>(o: anyObject): (keyof anyObject)[];
	}
}

export {};
