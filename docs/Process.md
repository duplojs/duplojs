# Process
Les process peuveut être utilisés pour créer une routine de vérification en y implémentant des checkers ou d'autres process, mais vous pouvez aussi les utiliser pour conteneuriser des interactions complexes avec l'objet request.

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
Un process doit être déclaré à partir de la `DuploInstance`.

```ts
duplo.createProcess("UserHasRight")//...
```

### Construction d'un process
La création d'un process a un pattern bien précis à respecter. Cet ordre imposé permettra une meilleure lisibilité.

```ts
duplo
.createProcess("UserHasRight")
.options(/* ... */) // vous ne pouvez appeler qu'une seule fois cette fonction
.input(/* ... */) // vous ne pouvez appeler qu'une seule fois cette fonction
.hook(/* ... */) // vous pouvez ajouter autant de Hook que vous souhaitez
.extract(/* ... */) // vous ne pouvez avoir qu'un seul extract
.process(/* ... */) // vous pouvez avoir autant de process que vous souhaitez
.check(/* ... */) // vous pouvez avoir autant de check que vous souhaitez
.cut(/* ... */) // vous pouvez avoir autant de cut que vous souhaitez
.handler(/* ... */) // ne laise plus que la possibilité d'utiliser la fonction build
.build(/* ... */)// cette fonction marque l'arrêt de la création du process
```

Chaque fonction en dessous d'une autre empêche de rappeler celles du dessus (sauf pour check, process et cut qui n'empêchent pas de se rappeler entre eux):

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
Cette méthode permet de cloturer la création d'un process. Elle prend en premier argument un tableau des clés du floor du process, celà permet de rendre ses valeurs accessibles lors de son implémentation.

**⚠️ Si la fonction build n'est pas appelée, le process n'est pas utilisable. ⚠️**

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

Cette méthode ajoute des options au process, qui peuvent être redéfinies à son implémentation.

### .input(function, ...any?)
```ts
const userHasRight = duplo
.createProcess("userHasRight")
.options({
    right: "write" as "write" | "read" 
})
// le floor de input est celui du parent dans lequel le process est implémenté
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

Cette méthode permet de créer une fonction input pour le process qui peut être redéfinie à son implémentation. La méthode peut paraitre similaire à options mais pour une question de sémantique il est important de séparer une valeur testée des options.

### .extract(object, function?, ...any?)
Cette fonction est identique à la méthode [extract des route](./Route.md#extractobject-function-any).

### .check(object, object, ...any?)
Cette fonction est identique à la méthode [check des route](./Route.md#checkobject-object-any).

### .cut(function, array?, ...any?)
Cette fonction est identique à la méthode [cut des route](./Route.md#cutfunction-array-any).

### .process(object, object, ...any?)
Cette fonction est identique à la méthode [process des route](./Route.md#processobject-object-any).

### .handler(function, ...any?)
Cette fonction est identique à la méthode [handler des route](./Route.md#handlerfunction-any) sauf qu'elle n'est pas obligatoire.

### .hook(string, function)
Cette méthode permet d'ajouter des [hooks](./Hook.md) au process. Ces hook seront transmis aux routes, aux abstractRoutes et aux process qui implémentent ce process. Son utilisation est identique à la méthode [hook des route](./Route.md#hookstring-function).

### Implémenter un process
L'explication d'implémentation est résumée avec la méthode [process des route](./Route.md#processobject-object-any).

#### Retour vers le [Sommaire](#sommaire).