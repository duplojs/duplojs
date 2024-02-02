# DuploJS
DuploJS est un framework TypeScript back-end orienté fonctionnel simple d'utilisation qui pourrait même être compris par des développeurs front-end ;).

Duplojs est conçu pour les développeurs qui accordent de l'importance à la clarté. Le framework a été pensé pour rendre toutes les opérations de vérification d'une route explicites, sans pour autant être trop "verbeux". Duplojs encourage la segmentation et la flexibilité afin que vos routes ne soient plus qu'un assemblage de briques. Chaque route deviendra une belle monade qui vous racontera une histoire sans erreurs et où chaque personnage joue correctement et successivement son rôle.

## Sommaire
- [Instalation](#instalation)
- [Premier pas](#premier-pas)
- [Duplo instance](./docs/DuploInstance.md)
- [Route](./docs/Route.md)
- [Request](./docs/Request.md)
- [Response](./docs/Response.md)
- [Checker](./docs/Checker.md)
- [Process](./docs/Process.md)
- [Abstract Route](./docs/AbstractRoute.md)
- [Content Type Parser](./docs/ContentTypeParser.md)
- [Hook](./docs/Hook.md)
- [Plugins](./docs/Plugins.md)

## Instalation
```
npm i @duplojs/duplojs
```

## Premier pas

### Initialiser le serveur
```ts
import Duplo, {zod} from "@duplojs/duplojs"; // Duplojs intègre zod directement

const duplo = Duplo({port: 1506, host: "0.0.0.0"});

// Définition des routes...

duplo.launch();
```

### Déclarer une route
```ts
duplo
.declareRoute("GET", "/user/{id}")
.handler((floor, response) => {
    response.code(200).info("quoicoubeh").send();
});
```

Comme vous pouvez le voir, vous n'avez pas un accès direct à la requête, et TANT MIEUX, car tel que je vous connais (bande de sagouin), vous auriez fait ça n'importe comment.

### Comment accéder aux valeurs de la request
```ts
duplo
.declareRoute("GET", "/user/{id}")
.extract({
    params: {
        id: zod.coerce.number()
    },
    headers: {
        role: zod.string().min(2).max(15)
    }
})
.handler((floor, response) => {
    response.code(200).info("quoicoubeh").send();
});
```

Grâce à la fonction [extract](./docs/Route.md#extractobject-function-any), vous pouvez, à l'aide de zod, extraire ce que vous souhaitez de la requête et garantir le type des variables :
- Le paramètre "id" n'acceptera qu'un nombre ou une chaîne de caractères contenant un nombre.
- Le champ "role" des headers n'acceptera qu'une chaîne de caractères ayant entre 2 et 15 caractères.

### Comment accéder au valeurs
```ts
duplo
.declareRoute("GET", "/user/{id}")
.extract({
    params: {
        id: zod.coerce.number()
    },
    headers: {
        role: zod.string().min(2).max(15)
    }
})
.handler((floor, response) => {
    response.code(200).info("quoicoubeh").send({
        id: floor.pickup("id"),
        role: floor.pickup("role")
    });
});
```

L'objet "[floor](./docs/Floor.md)" représente le sol de votre chambre. Tout comme les gros nerds que nous sommes, quand on a besoin de ranger quelque chose, on le jette par terre ``floor.drop("caleçons", "sale")``, puis on les ramasse plus tard avec ``floor.pickup("caleçons")`` (c'est juste un Map qui se balade à travers toutes les fonctions d'une route). Toutes les valeurs vérifiées dans l'extract sont automatiquement "drop" sur votre sol.

### Comment faire plus de vérification
Vous êtes peut-être tenté de faire toutes les vérifications dans le handler mais il faut que vous gardiez une chose en tête ! Le handler correspond à l'action finale, une fois arrivé ici en théorie il n'y a plus aucune vérification à faire. 

**Mais comment faire alors ?** Simplement grâce au [checker](./docs/Checker.md):
```ts
const userExist = duplo
.createChecker("userExist") // le nom du checker
// valeur par défaut des options
.options({ 
    index: "id" as "id" | "firstname" 
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
// fonction non obligatoire
.addPrecompleted( 
    "wantUser",
    {
        result: "user.exist",
        catch: (response, info) => response.code(404).info(info).send(),
        indexing: "user",
    }
)
.build();
```

Un [checker](./docs/Checker.md) est une fonction qui prend en entrée une valeur et doit toujours renvoyer une information et une données. Son implémentation permet d'effectuer une vérification. Dans l'exemple ci-dessus, le [checker](./docs/Checker.md) indique prendre en entrée un nombre ou une chaîne de caractères. Il propose une option "index" qui dans notre cas permet de définir par quelle clé on cherche un utilisateur. On aussi ajouter une précomplétion qui simplifi son implémentation.

### Implémenter un [checker](./docs/Checker.md)
```ts
duplo
.declareRoute("GET", "/user/{id}")
.extract({
    params: {
        id: zod.coerce.number()
    },
    headers: {
        role: zod.string().min(2).max(15)
    }
})
.check(
    userExist,
    {
        input: (pickup) => pickup("id"), // valeur d'entrée
        result: "user.exist", // info attendu pour continuer
        catch: (response, info) => response.code(404).info(info).send(), // action effectuer si l'info n'est pas c'elle attendu
        indexing: "user", // index de drop du resulta
        options: {index: "id"} // option utiliser
    }
)
// or
.check(
    userExist,
    {
        input: (pickup) => pickup("id"),
        ...userExist.precomplete.wantUser, // utilisation de la précomplétion
        options: {index: "id"}
    }
)
.handler((floor, response) => {
    response.code(200).info("quoicoubeh").send(floor.pickup("user"));
});
```

Ici, le [checker](./docs/Checker.md) prend comme valeur d'entrée l'ID qui a été précédemment "drop" au sol lors de l'extraction. Ensuite, il vérifie si la valeur de sortie est égale à "user.exist". Si c'est le cas, il continue l'exécution et indexe les données de sortie à "user". Sinon, il lance la fonction "catch" qui va renvoyer une erreur 404.

### Utiliser un [cut](./docs/Route.md#cutfunction-array-any)
```ts
duplo
.declareRoute("GET", "/user/{id}")
.extract({
    params: {
        id: zod.coerce.number()
    },
    headers: {
        role: zod.string().min(2).max(15)
    }
})
.cut((floor, response) => {
    if(floor.pickup("role") !== "admin")response.code(403).info("forbidden").send()
})
.check(
    userExist,
    {
        input: (pickup) => pickup("id"),
        ...userExist.precomplete.wantUser, // utilisation de la précomplétion
        options: {index: "id"}
    }
)
.handler((floor, response) => {
    response.code(200).info("quoicoubeh").send(floor.pickup("user"));
});
```
Les [checkers](./docs/Checker.md) sont conçus pour être utilisés à de nombreux endroits, mais il peut arriver d'avoir quelque chose de très spécifique. C'est pour cela que les [cuts](./docs/Route.md#cutfunction-array-any) ont été créés.

**⚠️ Attention à ne pas abuser des [cuts](./docs/Route.md#cutfunction-array-any), sinon vous vous éloignerez de l'utilité première, qui est la construction de code à base de briques réutilisables. ⚠️**

### Respecter l'exécution linéaire
Pour que Duplojs fonctionne correctement, il faut respecter son exécution. Une request a un chemin synchronisé et des étapes à franchir. Si vous souhaitez utiliser une réponse après une promesse, il vous faudra toujours utiliser await pour que l'exécution se fasse de manière linéaire.

```ts
duplo
.declareRoute("GET", "/user/{id}")
// hook, extract, process, checker, cut...
.handler(async (floor, response) => {

    // ✖ ne fonctionne pas (ti é con ou koi ?)
    // cela provoquera une erreur qui indiquera que rien n'a été envoyé
    new Promise(resolve => setTimeout(resolve, 1000))
    .then(() => response.code(200).info("j'effectue le dab").send());

    // ✔ fonctionne correctement (y comprend vite mais y faut lui expliquer longtemps)
    // l'exécution est en linéaire donc cela ne posera aucun problème
    await new Promise(resolve => setTimeout(resolve, 1000));
    response.code(200).info("il est mort pioupiou").send();
});
```

### Répondre est une erreur
Quand les fonctions send, sendFile, redirect et download sont appelées, elles créent une exception qui permet de stopper court au processus pour enchaîner sur le reste du cycle de vie de la request. Cependant, cela peut poser problème si vous appelez l'une de ces fonctions dans un try catch.

```ts
duplo
.declareRoute("GET", "/user/{id}")
// hook, extract, process, checker, cut...
.handler((floor, response) => {
    try{
        response.code(200).info("bien se passé").send();

        throw "bebou";
    }
    catch(error){
        // error === response;

        if(error instanceof Response) throw error;
    }
});
```

#### Retour vers le [Sommaire](#sommaire).