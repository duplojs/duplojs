# Process
Les process peveut-étre utilisais pour créer une routine de vérification en y implémentent des checker ou d'autre process, mais ils vous pouvez aussi les utilisais pour conteneuriser des interaction complexe avec l'objet request.

## Sommaire
- [Créer un process](#créer-un-process)
- [Construction d'un process](#construction-dun-process)
- [Build](#buildstring-any)
- [Options](#optionsobject-any)
- [Input](#inputfunction-any)
- [Extract](#extractobject-function-any)
- [Check](#checkobject-object-any)
- [Cut](#cutfunction-array-any)
- [Process](#processobject-object-any)
- [Handler](#handlerfunction-any)
- [Hook](#hookstring-function)
- [Implémenter un process](#implémenter-un-process)

### Créer un process
Un process doit étre déclaré a partire de la `DuploInstance`.

```ts
duplo.createProcess("UserHasRight")//...
```

### Construction d'un process
La création d'un process à un pattern bien précis à respecter. Cet ordre imposé permettra une meilleure lisibilité.

```ts
duplo
.createProcess("UserHasRight")
.options(/* ... */) // vous ne pouvez appler qu'une seul fois cette focntion
.input(/* ... */) // vous ne pouvez appler qu'une seul fois cette focntion
.hook(/* ... */) // vous pouvez ajouter autant de Hook que vous souhaitez
.extract(/* ... */) // vous ne pouvez avoir qu'un seul extract
.process(/* ... */) // vous pouvez avoir autant de process que vous souhaitez
.check(/* ... */) // vous pouvez avoir autant de check que vous souhaitez
.cut(/* ... */) // vous pouvez avoir autant de cut que vous souhaitez
.handler(/* ... */) // ne laise plus que la possibilité d'utilisais la fonction build
.build(/* ... */)// cette fonction marque l'arrét de la création du process
```

Chaque fonction en dessous d'une autre empêche de rappeler celles du dessus (sauf pour check, process et cut qui n'empêche pas de se rappeler entre eux):

```ts
duplo
.createProcess("UserHasRight")
.options(/* ... */)
.input(/* ... */)
.hook(/* ... */) 
.hook(/* ... */) 
.extract(/* ... */) // hook et extract ne sont plus disponibles
// vous pouvez avoir autant de process, check et cut que vous voulez et dans l'ordre que vous voulez.
.check(/* ... */) 
.process(/* ... */)
.process(/* ... */) 
.cut(/* ... */) 
.check(/* ... */)

.handler(/* ... */)
.build(/* ... */)
```
L'ordre des process, check et cut que vous définirez sera l'ordre d'exécution.

### .build(string[], ...any?)
```ts
const userHasRight = duplo
.createProcess("userHasRight")
.cut(
    () => ({ value: 25 }),
    ["value"]
)
.build(["value"]);
```
Cette method permet de cloturé la création d'un process. Elle prend en premiere argument un tableau des clés du floor du process, cela permet de rendre c'est valeur accessible lors de son implémentation.

**⚠️ Si la fonction build n'est pas appler le process n'est pas utilisable. ⚠️**

### .options(object, ...any?)
```ts
const userHasRight = duplo
.createProcess("userHasRight")
.options({
	right: "write" as "write" | "read" 
})
.cut(
    ({pickup}) => {
		return {
			right: pickup("options").right,
			value: 25,
		}
	},
    ["value", "right"]
)
.build(["value"]);
```

Cette method ajoute des options au process qui peuve étre redéfinit a son implémentation.

### .input(function, ...any?)
```ts
const userHasRight = duplo
.createProcess("userHasRight")
.options({
	right: "write" as "write" | "read" 
})
// le floor de input est celui du parent dans le qu'elle le process est implémenter
.input((pickup) => pickup<number | undefined>("userId") || null)
.cut(
    ({pickup}) => {
		return {
			userId: pickup("input"),
			right: pickup("options").right,
			value: 25,
		}
	},
    ["value", "right"]
)
.build(["value"]);
```

Cette method permet de créer une fonction input pour le process qui peut étre redéfinit a son implémentation. La methods peut parétre similaire a options mais pour une question nde sémentic il est important de séparé une valeur tester des options.

### .extract(object, function?, ...any?)
Cette fonction est exactement pareil que la methode [extract des route](./Route.md#extractobject-function-any).

### .check(object, object, ...any?)
Cette fonction est exactement pareil que la methode [check des route](./Route.md#checkobject-object-any).

### .cut(function, array?, ...any?)
Cette fonction est exactement pareil que la methode [cut des route](./Route.md#cutfunction-array-any).

### .process(object, object, ...any?)
Cette fonction est exactement pareil que la methode [process des route](./Route.md#processobject-object-any).

### .handler(function, ...any?)
Cette fonction est exactement pareil que la methode [handler des route](./Route.md#handlerfunction-any) sauf qu'elle n'est pas obligatoire.

### .hook(string, function)
Cette methode permet d'ajouter des [hooks](./Hook.md) au process. C'est hook seront transmit au route, au abstract route et au process qui implémente ce le process. Son utilisation est exactement pareille que la methode [hook des route](./Route.md#hookstring-function).

### Implémenter un process
l'explication d'implémentation est résumer avec la methode [process des route](./Route.md#processobject-object-any).

#### Retour vers le [Sommaire](#sommaire).