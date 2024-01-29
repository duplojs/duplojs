import Duplo, {DuploInstance} from "../../../scripts";

it("get duplo instance", () => {
	const duplo = Duplo({port: 1506, environment: "DEV", host: "localhost"});

	expect(duplo).instanceof(DuploInstance);
});
