# DuploJS
DuploJS est un framework TypeScript/JavaScript back-end orienter fonctionnel simple d'utilisation qui pourrait même être compris pars des développeurs front-end ;).

## Sommaire
- [Instalation](#instalation)
- [Premier pas](#premier-pas)
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

Comme vous pouvez le voir vous n'avez pas accès directement à la request et **TANT MIEUX** car tel que je vous connais (bande de sagouin) vous auriez fait ça n'importe comment.

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

Grâce à la fonction extracte vous pouvez à l'aide de zod extraire ce que vous souhaitez de la request et garantir le type des variables:
- le paramètre id n'acceptera qu'un nombre ou une chaîne de caractère contenant un nombre
- le champ role du headers n'acceptera qu'une string ayant entre 2 et 15 caractères

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

L'objet "floor" qui représente le sol de votre chambre. Tout comme les gros nerd que nous sommes, quand on a besoin de ranger quelque chose on le jette par terre: ``floor.drop("caleçons", "sale")``, puis tu les ramasse plus tard : ``floor.pickup("caleçons")`` (c'est juste un Map qui se balade à travers toutes les fonctions d'une route). Toutes les valeurs vérifiées dans l'extract sont automatiquement "drop" sur votre sol.

### Comment faire plus de vérification
Vous êtes peut-être tenté de faire toutes les vérifications dans le handler mais il faut que vous gardiez une chose en tête ! Le handler correspond à l'action finale, une fois arrivé ici en théorie il n'y a plus aucune vérification à faire. 

**Mais comment faire alors ?** Simplement grâce au **checker**:
```ts
const userExist = duplo.createChecker(
    "userExist", // le nom du checker
    {
        async handler(value: number | string, output, options){
            let search: {index: string, value: number | string} = {
                index: options.type, 
                value
            };
            
            const user = await MySuperDataBase(search);
            if(!user) return output("user.notexist");
            else return output("user.exist", user);
        },
        outputInfo: ["user.exist", "user.notexist"], // différentes informations de sortie possible
        options: { // valeur par défaut des options
			type: "id" as "id" | "firstname" 
		}, 
    }
);
```

Un checker est un test unitaire, il prend en entrée une valeur et doit toujours ressortir une information et peut renvoyer une donnés. leur but est d'effectuer une vérification. Dans l'exemple ci-dessus, le checker indique prendre en entrée un nombre ou une string, il autorise comme informations de sortie: "user.exist", "user.notexist" et propose une option "type" qui dans notre cas permet de définir par quelle clé on cherche un utilisateur. 

### Implémenter un checker
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
        options: {type: "id"} // option utiliser
    }
)
.handler((floor, response) => {
    response.code(200).info("quoicoubeh").send(floor.pickup("user"));
});
```

Ici le checker prend comme valeur d'entrée l'id qui a été précédemment drop au sol lors de l'extraction, puis il vérifie si la valeur de sortie est égal à "user.exist", si oui il continue l'exécution et index la data de sortie a "user", si non il lance la fonction catch qui va renvoyer une erreur 404.

### Utiliser un cut
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
        result: "user.exist",
        catch: (response, info) => response.code(404).info(info).send(),
        indexing: "user",
        options: {type: "id"}
    }
)
.handler((floor, response) => {
    response.code(200).info("quoicoubeh").send(floor.pickup("user"));
});
```
Les checkers sont faits pour être utilisé à plein d'endroits mais il peut arriver d'avoir quelque chose de très spécifique, c'est pour ça que les cuts ont été créés.

**⚠️ Attention à ne pas abuser des cuts sinon vous vous éloignerez de de l'utilité première qui est la construction de code à base de brique réutilisable. ⚠️**

### Respecter l'exécution linéaire

Pour que Duplojs puisse fonctionner correctement, il faut respecter son exécution, une request a un chemin synchronisé et des étapes à franchir. si vous souhaitez utiliser une réponse après une promesse, il vous faudra toujours `await` cette promesse pour que l'exécution se fasse de manière linéaire.

```ts
duplo
.declareRoute("GET", "/user/{id}")
// hook, access, extract, process, checker, cut...
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
Quand les function send, sendFile et download sont appelés elles crée une exception qui permet de stopper court au processus pour enchaîner sur le reste du cycle de vie de la request. Cependant cela peut poser problème si vous appelez l'une de ces fonctions dans un try catch.

```ts
duplo
.declareRoute("GET", "/user/{id}")
// hook, access, extract, process, checker, cut...
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