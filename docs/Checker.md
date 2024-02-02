# Checker
Les checker son des block de code qui on pour bute de faire une vérification. Il prenne une valeur en entré et retourne une info qui peut-étre accompagner d'une donner. Leur implémentation est explicique et peu ce faire que d'une seul manier donc impossible de ne pas comprendre leurs comportement !

## Sommaire
- [Créer un checker](#créer-un-checker)
- [Construction d'un checker](#construction-dun-checker)
- [Build](#buildany)
- [Options](#optionsobject-any)
- [AddPrecompleted](#addprecompletedstring-object-any)
- [Implémenter un checker](#implémenter-un-checker)

### Créer un checker
Un checker doit étre créer a partire de la `DuploInstance`.

```ts
const userExist = duplo.createChecker("userExist")//...
```
### Construction d'un checker

La création d'un checker à un pattern bien précis à respecter. Cet ordre imposé permettra une meilleure lisibilité.

```ts
duplo
.createChecker("userExist")
.options(/* ... */) // vous ne pouvez appler qu'une seul fois cette focntion
.handler(/* ... */) // vous ne pouvez appler qu'une seul fois cette focntion

.addPrecompleted(/* ... */) // vous pouvez avoir autant de précompletion que vous souhaitez
.addPrecompleted(/* ... */)

.build(/* ... */) // cette fonction marque l'arrét de la création du checker
```

Chaque fonction en dessous d'une autre empêche de rappeler celles du dessus (sauf pour addPrecompleted qui n'empêche pas de se rappeler).

### .build(...any?)

```ts
const userExist = duplo
.createChecker("userExist")
.handler(/* ... */)
.build();
```

Cette method permet de cloturé la création d'un checker. 

**⚠️ Si la fonction build n'est pas appler le process n'est pas utilisable. ⚠️**

### .options(object, ...any?)

```ts
const userExist = duplo
.createChecker("userExist")
.options({
    index: "id" as "id" | "firstname",
})
.handler(/* ... */)
.build();
```

Cette method ajoute des options au checker qui peuve étre redéfinit a son implémentation.

### .handler(function, ...any?)

```ts
const userExist = duplo
.createChecker("userExist")
.options({
    index: "id" as "id" | "firstname",
})
.handler((input: number | string, output, options) => {
    const user = await myDataBase.user.findOne({
        [options.index]: input
    });

    if(!user) {
        return output("user.notexist", null);
    }
    else {
        return output("user.exist", user);
    }
})
.build();
```

La methods handler permet de définir la fonction qui sera la logique du checker. L'argument `input` définit le type de donnés d'entrer du checker, L'argument `output` est une function qui doit étre utiliser OBLIGATOIREMENT en retour de la fonction, elle associ le type de donné de sortie avec une information. `options` correspond au options utilisais du checker.

### .addPrecompleted(string, object, ...any?)

```ts
const userExist = duplo
.createChecker("userExist")
.options({
    index: "id" as "id" | "firstname",
})
.handler((input: number | string, output, options) => {
    const user = await myDataBase.user.findOne({
        [options.index]: input
    });

    if(!user) {
        return output("user.notexist", null);
    }
    else {
        return output("user.exist", user);
    }
})
.addPrecompleted( 
    "wantUser",
    {
        result: "user.exist",
        catch: (response, info) => response.code(404).info(info).send(),
        indexing: "user",
    }
)
.addPrecompleted( 
    "wantNotfoundUser",
    {
        result: "user.notexist",
        catch: (response, info) => response.code(409).info(info).send(),
    }
)
.build();
```

Cette method permet de définir de la précomplétions pour l'implémentation d'un checker. Vous pouvais en voir autent que vous le souhétais.

### Implémenter un checker
Les checker s'utilise uniquement avec la method `check` des route, process et abstractRoute.

```ts
// route, process ou abstractRoute
.check(
    userExist,
    {
        input: (pickup) => pickup("id"), // valeur d'entrée
        result: "user.exist", // info attendu pour continuer
        catch: (response, info) => response.code(404).info(info).send(), // action effectuer si l'info n'est pas c'elle attendu
        indexing: "user", // index de drop du resulta
    }
)
//
.check(
    userExist,
    {
        input: (pickup) => pickup("firstname"), // valeur d'entrée
        ...userExist.precomplete.wantNotfoundUser,
        options: {
            index: "firstname"
        }
    }
)
// suite
```

#### Retour vers le [Sommaire](#sommaire).