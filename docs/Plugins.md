# Plugins
DuploJS propose beaucoup possibilité pour être modifier afin de pouvoir toujour répondre au problématique.

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

Vous pouvez utilisais la fonction `use` afin d'implémenter les plugins. Il est possible de sans passer mais pour une question de quoérence et d'organisation il est recommander de l'utilisais.

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

Les plugins son juste des fonctions qui seront exécuter pas la fonction `use` 

### Exemple de plugin
**Context :** J'ai créer un process qui extract depuis les parmas un id. 

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

Malheuresemnt, si il est implémenter dans une route qui a un path sans params id c'est sur est certain que cela ne va pas fonction.  

```ts
duplo.declareRoute("GET", "/user/{firstname}") // pas de paramétre id donc Erreur a coup sure 
.process(
	userExistProcess,
	{
		pickup: ["user"],
	}
)
.handler(({pickup}, res) => res.send(pickup("user")));
```

**solution :** Je voudrais creer un event qui ce déclanche quand une route implémente un process afin de pouvoir faire des vérification et peut-étre voirs en avance des potentiel erreur.

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
					throw new Error(`La route ${route.method}:${path} utilise le process userExist en éyan un path qui ne contien pas {id}`)
				}
			})
		}
	}
)
```

#### Retour vers le [Sommaire](#sommaire).