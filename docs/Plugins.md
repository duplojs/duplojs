# Plugins
DuploJS propose beaucoup de possibilités pour être modifié afin de pouvoir toujours répondre aux problématiques.

## Sommaire
- [Utiliser un plugin](#utiliser-un-plugin)
- [Créer un plugin](#créer-un-plugin)
- [Exemple de plugin](#exemple-de-plugin)

### Utiliser un plugin
```ts
import Duplo from "@duplojs/duplojs";
import duploCookie from "@duplojs/cookie";

const duplo = Duplo(/* ... */);

// bonne façon ✔
duplo.use(duploCookie, {/* plugin's options*/});

// mauvaise façon ✖
duploCookie(duplo, {/* plugin's options*/});
```

Vous pouvez utiliser la fonction `use` afin d'implémenter les plugins. Il est possible de s'en passer mais pour une question de cohérence et d'organisation il est recommandé de l'utiliser.

### Créer un plugin
```ts
interface MypluginOptions{
	option1?: string,
	option2?: number,
}

function myPlugin(instance: DuploInstance<DuploConfig>, options: MypluginOptions){
	/* ... */
}

duplo.use(myPlugin, {option1: "test"});
```

Les plugins sont juste des fonctions qui seront exécutées par la fonction `use` .

### Exemple de plugin
**Context :** J'ai créé un process qui extract un id depuis les params. 

```ts
const userExistProcess = duplo.createProcess("userExist")
.extract({
	params: {
		id: zod.coerce.number(),
	},
})
//...
.build(["user"])
```

Malheureusemnt, s'il est implémenté dans une route qui a un path sans params id, il est certain que celà ne va pas fonctionner.  

```ts
duplo.declareRoute("GET", "/user/{firstname}") // pas de paramètre id donc Erreur à coup sûr 
.process(
	userExistProcess,
	{
		pickup: ["user"],
	}
)
.handler(({pickup}, res) => res.send(pickup("user")));
```

**solution :** Je voudrais créer un event qui ce déclanche quand une route implémente un process, afin de pouvoir faire des vérifications et peut être voir en avance des potentielles erreurs.

**réalisation :**
```ts
interface OnRouteUseProcessOptions{
	process: Process,
	handler(route: Route): void,
}

function onRouteUseProcess(instance: DuploInstance<DuploConfig>, options: OnRouteUseProcessOptions){
	instance.addHook("onDeclareRoute", (route) => {
		route.steps.foreach((step) => {
			if(
				step instanceof ProcessStep && 
				step.process === options.process
			){
				options.handler(route);
			}
		})
	})
}

duplo.use(
	onRouteUseProcess,
	{
		process: userExistProcess,
		handler(route){
			route.paths.foreach((path) => {
				if(!path.includes("{id}")){
					throw new Error(`La route ${route.method}:${path} utilise le process userExist en ayant un path qui ne contient pas {id}`)
				}
			})
		}
	}
)
```

#### Retour vers le [Sommaire](#sommaire).