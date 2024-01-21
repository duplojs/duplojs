import makeCheckerBuilder from "../builder/checker";
import {Checker as DefaultChecker} from "../duplose/checker";
import {ServerHooksLifeCycle} from "../hook";

export type Checkers = Record<string, DefaultChecker>

export default function makeCheckerSystem(
	serverHooksLifeCycle: ServerHooksLifeCycle
){
	const Checker = class extends DefaultChecker<any, any, any, any>{};
	const checkers: Checkers = {};
	const {createChecker} = makeCheckerBuilder(serverHooksLifeCycle, Checker, checkers);

	return {
		Checker,
		createChecker,
		checkers,
	};
}
