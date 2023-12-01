# Abstract Route
Les abstract route sont faite sois pour créée des systéme d'autentification, sois pour altérer les objets [Request](./Request.md) et [reponse](./Response.md) de manier local. Cela peux ressemblé a des middleware a l'éxéptions qu'il garentise un typage parfait sans devoir redéfinir quoi que ce sois.

## Sommaire
- [Déclarer une abstract route](#déclarer-une-abstract-route)
- [Propriétés du abstractRouteParams](#propriétés-du-abstractrouteparams)
- [Construction d'une abstract route](#construction-dune-abstract-route)
- [Build](#buildstring-any)
- [Extract]()
- [Check]()
- [Cut]()
- [Process]()
- [Handler]()
- [Hook]()

### Déclarer une abstract route
Une route peut étre déclaré a partire de deux chose, sois depuis la `DuploInstance`, sois depuis une `AbstractRouteInstance`.

```ts
duplo.declareAbstractRoute(
    "MustBeConnected", 
    {
        options: { role: "admin" as "manager" | "admin" }, 
        prefix: "/dashboard",
    }
)//...
```

### Propriétés du abstractRouteParams
propriétés|type|definition
---|---|---
options|`Record<string, any>`|Permet de définir les options par défaut. Vous pouvez y accéder a traver le floor.
prefix|`string`|Définit un préfix pour les route qui seront déclarer avec l'abstract route.
allowExitProcess|`boolean` \| `undefined`|Permet d'activer la prise en charge de la fonction ExitProcess.

### Construction d'une abstract route
La déclaration d'une abstract route à un pattern bien précis à respecter. Cet ordre imposé permettra une meilleure lisibilité.

```ts
duplo
.declareAbstractRoute("MustBeConnected")
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
.declareAbstractRoute("MustBeConnected")

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
const mustBeConnected = duplo.declareAbstractRoute(
    "MustBeConnected", 
    {
        options: { role: "admin" as "manager" | "admin" }, 
        prefix: "/dashboard",
    }
)
.cut(
    () => ({ value: 25 }),
    ["value"]
)
.build(["value"]);
```
Cette method permet de cloturé la déclaration des abstract route. Elle prend en premiere argument un tableau des clés du floor de l'abstract route, cela permet de rendre c'est valeur accessible lors de son implémentation.

**⚠️ Si la fonction build n'est pas appler l'abstract route n'est pas utilisable. ⚠️**

### .extract(object, function?, ...any?)
Cette fonction est exactement pareil que la methode [extract des route](./Route.md#extractobject-function-any).

### .check(object, object, ...any?)
Cette fonction est exactement pareil que la methode [check des route](./Route.md#checkobject-object-any).

### .cut(function, array?, ...any?)
Cette fonction est exactement pareil que la methode [cut des route](./Route.md#cutfunction-array-any).

### .process(object, object, ...any?)
Cette fonction est exactement pareil que la methode [process des route](./Route.md#cutfunction-array-any).

### .handler(function, ...any?)
Cette fonction est exactement pareil que la methode [handler des route](./Route.md#handlerfunction-any) sauf qu'elle n'est pas obligatoire.

### .hook(string, function)
Cette methode permet d'ajouter des [hooks](./Hook.md) a l'abstract route. C'est hook seront transmit au route, au abstract route qui utiliseront cette abstract route. Son utilisation est exactement pareille que la methode [hook des route](./Route.md#hookstring-function).

#### Retour vers le [Sommaire](#sommaire).