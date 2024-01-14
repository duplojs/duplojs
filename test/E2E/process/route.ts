import Duplo, {zod} from "../../../scripts/index";
import {parentPort} from "worker_threads";
import {IsAdmin, IsCustomer, IsManager, IsOwner, IsUser} from "./process";

const duplo = Duplo({port: 1506, host: "localhost"});

const isAdmin = IsAdmin(duplo);
const isManager = IsManager(duplo);
const isCustomer = IsCustomer(duplo);
const isOwner = IsOwner(duplo);
const isUser = IsUser(duplo);

duplo.declareRoute("GET", "/process/test/1")
.process(
	isAdmin,
	{
		pickup: ["pick"],
	}
)
.handler(({pickup: p}, res) => res.code(200).info("result").send(p("pick")));

duplo.declareRoute("GET", "/process/test/2")
.extract({
	query: {
		skip: zod.literal("true").optional()
	}
})
.process(
	isAdmin,
	{
		skip: p => p("skip") === "true",
	}
)
.handler(({pickup: p}, res) => res.code(200).info("result").send());

duplo.declareRoute("GET", "/process/test/3")
.process(
	isManager
)
.handler(({pickup: p}, res) => res.code(204).info("result").send());

duplo.declareRoute("GET", "/process/test/4")
.extract({
	query: {
		number: zod.coerce.number(),
	}
})
.process(
	isCustomer,
	{
		input: p => p("number"),
	}
)
.handler(({pickup: p}, res) => res.code(204).info("result").send());

duplo.declareRoute("GET", "/process/test/5")
.process(
	isOwner,
	{
		options: {
			option1: 14,
		}
	}
)
.handler(({pickup: p}, res) => res.code(204).info("result").send());

duplo.declareRoute("GET", "/process/test/6")
.extract({
	query: {
		number: zod.coerce.number(),
	}
})
.process(
	isUser,
	{
		options: p => ({
			option1: p("number"),
		})
	}
)
.handler(({pickup: p}, res) => res.code(204).info("result").send());

duplo.launch(() => parentPort?.postMessage("ready"));
