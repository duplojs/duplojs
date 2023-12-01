# Checker
Les checker son des block de code qui on pour bute de faire une vérification. Il prenne une valeur en entré et retourne une info qui peut-étre accompagner d'une donner. Leur implémentation est explicique et peu ce faire que d'une seul manier donc impossible de ne pas comprendre leurs comportement !

## Sommaire
- [Créer un checker](#propriétés-de-response)
- [Propriétés du checkerParams](#répondre-est-une-erreur)
- [Implémenter un checker](#implémenter-un-checker)

### Créer un checker
```ts
const userExist = duplo.createChecker(
    "userExist", // le nom du checker
    {
        async handler(value: number | string, output, options){
            const user = await myDataBase.user.findOne({
                [options.type]: value
            });
            if(!user) return output("user.notexist");
            else return output("user.exist", user);
        },
        // différentes informations de sortie possible
        outputInfo: ["user.exist", "user.notexist"],
        // valeur par défaut des options
        options: { 
            type: "id" as "id" | "firstname" 
        }, 
    }
);
```

Ce checker peut-étre utilisais pour deux vérification, sois pour voir si un user exist sois pour voirs si il existe pas. Plus vous apporté des 

### Propriétés du checkerParams
propriétés|type|definition
---|---|---
handler|`handler(input: any, output: CheckerOutputFunction, options: Record<string, any>): CheckerOutput`|Fonction qui de vérification, vous devez définir le type du premier paramétre pour que son implémentation sois parfaite. Elle doit obligatoirement returne le resulta de la fonction `output`.
outputInfo|`string[]`|Liste des différente information que vas retourné le checker
options|`Record<string, any>` \| `undefined`|Options pars défaut du checker.

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
// suite
```

#### Retour vers le [Sommaire](#sommaire).