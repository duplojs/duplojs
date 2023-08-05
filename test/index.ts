import Duplo from "../scripts/index";

export const duplo = Duplo({port: 1506, host: "0.0.0.0"});

duplo.setNotfoundHandler((request, response) => {
	response.code(200).send("notfound");
});

duplo.setErrorHandler((request, response, error) => {
	response.code(500).info("error").send(error);
});

Promise.all([import("./checker")]).then(() => duplo.launch());
