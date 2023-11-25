# Duplo instance
La DuploInstance est l'objet pricipal de duplojs, c'est a aprtire de lui que nous déclaront toute les fonctionaliter de notre API.

## Sommaire
- [Avoir la DuploInstance](#avoir-la-duploinstance)
- [Propriétés de la DuploInstance](#propriétés-de-la-duploinstance)

### Avoir la DuploInstance
```ts
import Duplo from "@duplojs/duplojs";

const duplo = Duplo({port: 1506, host: "0.0.0.0"});

// duplo === DuploInstance
```

### Propriétés de la DuploInstance
propriétés|definition
---|---
Request|
Response|
server|
config|
launch|
addHook|
declareRoute|
createChecker|
setNotfoundHandler|
setErrorHandler|
createProcess|
addContentTypeParsers|
declareAbstractRoute|
mergeAbstractRoute|
use|
routes|
checkers|
processes|
abstractRoutes|
plugins|

#### Retour vers le [Sommaire](#sommaire).