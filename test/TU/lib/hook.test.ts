import {Hook} from "../../../scripts";

describe("hook", () => {
	const hook = new Hook<[boolean?]>(1);

	beforeEach(() => {
		hook.removeAllSubscriber();
	});

	it("add subscriber", () => {
		const fnc = () => {};

		expect(hook.hasSubscriber(fnc)).toBe(false);

		hook.addSubscriber(fnc);

		expect(hook.hasSubscriber(fnc)).toBe(true);
	});

	it("remove subscriber", () => {
		const fnc = () => {};

		hook.addSubscriber(fnc);
		hook.removeSubscriber(fnc);

		expect(hook.hasSubscriber(fnc)).toBe(false);
	});

	it("launch subscriber", () => {
		let testlaunch = false;
		const fnc = () => {
			testlaunch = true;
		};

		hook.addSubscriber(fnc);
		hook.launchSubscriber();

		expect(testlaunch).toBe(true);
	});

	it("launch subscriber async", async() => {
		let testlaunch = false;
		const fnc = async() => {
			await new Promise((r) => {setTimeout(r);});
			testlaunch = true;
		};

		hook.addSubscriber(fnc);
		await hook.launchSubscriberAsync();

		expect(testlaunch).toBe(true);
	});

	it("launch all subscriber async", async() => {
		let testlaunch = false;
		const fnc = async() => {
			await new Promise((r) => {setTimeout(r);});
			testlaunch = true;
		};

		let testlaunch1 = false;
		const fnc1 = async() => {
			await new Promise((r) => {setTimeout(r);});
			testlaunch1 = true;
		};

		const hook1 = new Hook(0);

		hook.addSubscriber(fnc, hook1);
		hook1.addSubscriber(fnc1);

		await hook.launchAllSubscriberAsync();

		expect(testlaunch).toBe(true);
		expect(testlaunch1).toBe(true);
	});

	it("launch subscriber return", () => {
		let testlaunch = false;
		const fnc1 = () => true;
		const fnc2 = () => {
			testlaunch = true;
		};
		hook.addSubscriber(fnc1);
		hook.addSubscriber(fnc2);
		hook.launchSubscriber();

		expect(testlaunch).toBe(false);
	});

	it("launch subscriber async return", () => {
		let testlaunch = false;
		const fnc1 = () => true;
		const fnc2 = () => {
			testlaunch = true;
		};
		hook.addSubscriber(fnc1);
		hook.addSubscriber(fnc2);
		hook.launchSubscriberAsync();

		expect(testlaunch).toBe(false);
	});

	it("copy hook", async() => {
		let testlaunch = false;
		const fnc1 = () => true;
		const fnc = () => {
			testlaunch = true;
		};

		const copyedHook = new Hook(0);
		copyedHook.addSubscriber(fnc);
		copyedHook.addSubscriber(fnc1);
		hook.addSubscriber(copyedHook);

		hook.launchSubscriber();

		expect(testlaunch).toBe(true);

		testlaunch = false;

		await hook.launchSubscriberAsync();

		expect(testlaunch).toBe(true);
	});

	it("copy hook and build", () => {
		let testlaunch = false;
		const fnc = () => {
			testlaunch = true;
		};

		const copyedHook = new Hook(0);
		copyedHook.addSubscriber(fnc);
		hook.addSubscriber(copyedHook);
		
		const buidedHook = hook.build();
		buidedHook();

		expect(testlaunch).toBe(true);
	});

	it("build hook", () => {
		let testlaunch = false;
		const fnc = () => {
			testlaunch = true;
		};

		hook.addSubscriber(fnc);
		const buidedHook = hook.build();
		buidedHook();

		expect(testlaunch).toBe(true);
	});

	it("build hook return", () => {
		let testlaunch = false;
		const fnc1 = () => true;
		const fnc2 = () => {
			testlaunch = true;
		};

		hook.addSubscriber(fnc1);
		hook.addSubscriber(fnc2);
		const buidedHook = hook.build();
		buidedHook();
		
		expect(testlaunch).toBe(false);
	});
});
