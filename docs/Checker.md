# Checker
Les checker sont des blocks de code qui ont pour but de faire une vérification. Il prennent une valeur en entrée et retournent une info qui peut être accompagnée d'une donnée. Leur implémentation est explicique et ne peut se faire d'une seule manière, donc impossible de ne pas comprendre leur comportement !

## Sommaire
- [Créer un checker](#créer-un-checker)
- [Construction d'un checker](#construction-dun-checker)
- [Build](#buildany)
- [Options](#optionsobject-any)
- [AddPrecompleted](#addprecompletedstring-object-any)
- [Implémenter un checker](#implémenter-un-checker)

### Créer un checker
Un checker doit être créé à partir de la `DuploInstance`.

```ts
const userExist = duplo.createChecker("userExist")//...
```
### Construction d'un checker

La création d'un checker a un pattern bien précis à respecter. Cet ordre imposé permettra une meilleure lisibilité.

```ts
duplo
.createChecker("userExist")
.options(/* ... */) // vous ne pouvez appeler qu'une seule fois cette fonction
.handler(/* ... */) // vous ne pouvez appeler qu'une seule fois cette fonction

.addPrecompleted(/* ... */) // vous pouvez avoir autant de précompletion que vous souhaitez
.addPrecompleted(/* ... */)

.build(/* ... */) // cette fonction marque l'arrêt de la création du checker
```

Chaque fonction en dessous d'une autre empêche de rappeler celles du dessus (sauf pour addPrecompleted qui n'empêche pas de se rappeler).

### .build(...any?)

```ts
const userExist = duplo
.createChecker("userExist")
.handler(/* ... */)
.build();
```

Cette méthode permet de clôturer la création d'un checker. 

**⚠️ Si la fonction build n'est pas appelée, le process n'est pas utilisable. ⚠️**

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

Cette méthode ajoute des options au checker qui peuvent être redéfinies à son implémentation.

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

La méthode handler permet de définir la fonction qui sera la logique du checker. L'argument `input` définit le type de donnée d'entrée du checker, l'argument `output` est une fonction qui doit être utilisée OBLIGATOIREMENT en retour de la fonction, elle associe le type de donnée de sortie avec une information. `options` correspond aux options utilisées du checker.

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

Cette méthode permet de définir de la précomplétion pour l'implémentation d'un checker. Vous pouvez en avoir autant que vous le souhaitez.

### Implémenter un checker
Les checkers s'utilisent uniquement avec la méthode `check` des routes, process et abstractRoute.

```ts
// route, process ou abstractRoute
.check(
    userExist,
    {
        input: (pickup) => pickup("id"), // valeur d'entrée
        result: "user.exist", // info attendue pour continuer
        catch: (response, info) => response.code(404).info(info).send(), // action effectuée si l'info n'est pas celle attendue
        indexing: "user", // index de drop du resultat
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