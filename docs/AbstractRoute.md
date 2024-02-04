# Abstract Route
Les abstractRoutes sont faites soit pour créer des systèmes d'authentification, soit pour altérer les objets [Request](./Request.md) et [reponse](./Response.md) de manière locale. Celà peut ressembler à des middleware à l'exception qu'ils garantissent un typage parfait sans devoir redéfinir quoi que ce soit.

## Sommaire
- [Déclarer une abstract route](#déclarer-une-abstract-route)
- [Propriétés du abstractRouteParams](#propriétés-du-abstractrouteparams)
- [Construction d'une abstract route](#construction-dune-abstract-route)
- [Build](#buildstring-any)
- [Options](#optionsobject-any)
- [Extract](#extractobject-function-any)
- [Check](#checkobject-object-any)
- [Cut](#cutfunction-array-any)
- [Process](#processobject-object-any)
- [Handler](#handlerfunction-any)
- [Hook](#hookstring-function)
- [Utiliser une abstract route](#utiliser-une-abstract-route)
- [Propriétés du useAbstractRouteParams](#propriétés-du-useabstractrouteparams)
- [Merge des abstract route](#merge-des-abstract-route)

### Déclarer une abstract route
Une route peut être déclaré à partir de deux choses, soit depuis la `DuploInstance`, soit depuis une `AbstractRouteInstance`.

```ts
duplo.declareAbstractRoute("MustBeConnected")//...
```

### Construction d'une abstract route
La déclaration d'une abstract route a un pattern bien précis à respecter. Cet ordre imposé permettra une meilleure lisibilité.

```ts
duplo
.declareAbstractRoute("MustBeConnected")
.options(/* ... */) // vous ne pouvez appeler qu'une seule fois cette fonction
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
.declareAbstractRoute("MustBeConnected")
.options(/* ... */)
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
const mustBeConnected = duplo.declareAbstractRoute("MustBeConnected")
.cut(
    () => ({ value: 25 }),
    ["value"]
)
.build(["value"]);
```
Cette methode permet de clôturer la déclaration des abstract routes. Elle prend en premier argument un tableau des clés du floor de l'abstract route, celà permet de rendre ces valeurs accessibles lors de son utilisation.

**⚠️ Si la fonction build n'est pas appelée, l'abstract route n'est pas utilisable. ⚠️**

### .options(object, ...any?)
Cette fonction est identique à la méthode [options des process](./Process.md#optionsobject-any).

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
Cette méthode permet d'ajouter des [hooks](./Hook.md) à l'abstract route. Ces hook seront transmis aux routes, aux abstractRoutes qui utiliseront cette abstract route. Son utilisation est identique à la méthode [hook des route](./Route.md#hookstring-function).

### Utiliser une abstract route
```ts
mustBeConnected({
    pickup: ["value"],
    options: { role: "manager" },
})
.declareRoute("PATCH", "/user/{id}")
.extract({
    params: {
        id: zod.number(),
    },
    /* ... */
})
.handler(({pickup}) => {
    pickup("value");
    pickup("id");

    /* ... */
});
```

Après avoir build votre abstract route vous obtenez une fonction. Cette fonction vous renvoie les méthodes `declareRoute` et `declareAbstractRoute` quand vous l'appelez. La fonction peux prendre en argument un objet qui permet de personaliser l'utilisation de l'abstract route.

### Propriétés du useAbstractRouteParams
propriétés|type|definition
---|---|---
options|`Record<string, any>` \| `undefined`|Permet de définir les options par défaut. Vous pouvez y accéder à travers le floor.
pickup|`string[]` \| `undefined`|Permet d'importer les valeurs du floor de l'abstract route.

### Merge des abstract routes
```ts
const baseAbstractRoute = duplo.mergeAbstractRoute([
    abstractCookie,// abstract route issue d'un plugin
    abstractCors, // abstract route issue d'un plugin
]);

baseAbstractRoute.declareAbstractRoute("MustBeConnected")
.cut(
    () => ({ value: 25 }),
    ["value"]
)
.build(["value"]);
```

Certains plugins peuvent fournir des abstract routes pour effectuer des actions en local. Dans l'exemple au-dessus, nous pouvons imaginer que les abstract routes fournies servaient à lire les cookies et à ajouter les en-têtes CORS. Grâce à la méthode `mergeAbstractRoute` vous pouvez combiner les deux pour obtenir une nouvelle abstract route.

**⚠️ Cette méthode a été créé dans le but de fusionner des abstract routes que vous n'avez pas créées, favoriser la création d'abstract route à partir d'une autre abstract route plutôt que de les merge. ⚠️**

#### Retour vers le [Sommaire](#sommaire).