import {workersTesting} from "@duplojs/worker-testing";

workersTesting(
	(path) => import(path),
	__dirname + "/route",
	__dirname + "/checker",
	__dirname + "/process",
	__dirname + "/abstractRoute",
	__dirname + "/mergeAbstractRoute",
	__dirname + "/hook",
);
