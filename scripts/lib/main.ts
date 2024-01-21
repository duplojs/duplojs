import {DuploConfig, DuploInstance} from "./duploInstance.ts";

const Duplo = <duploConfig extends DuploConfig>(config: duploConfig) => new DuploInstance<duploConfig>(config);

export default Duplo;
