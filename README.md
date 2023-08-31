# DuploJS
DuploJS est un framework TypeScript/JavaScript back-end orienter fonctionnel simple d'utilisation qui pourrait même être compris pars des développeurs front-end ;).

Pour faire simple vos routes sont une succession de test unitaire avec au bout une action : 
```
___________________________
|                         |
|      un client beau     |
|    et plein d'argent    |<-------\
|_________________________|        |
    /|\      |                     |
     |       | request http        |
     |       | GET /user/{id}      |
     |       |                     | negative response 
     |      \|/                    |
     |    Duplojs                  |
     |       |                     |
     |       |_____________________| 403 
     |       | has autorization    |
     |       |                     |
     |       |_____________________| 400
     |       | params id is number |
     |       |                     |
     |       |_____________________| 404
     |       | user exist
     |       |
 200 |_______|
      response 
    containing user 
```

Cela ressemble au chemin d'une request lambda que vous auriez pu faire simplement avec express ou fastify mais **DuploJS** se différencie pars ça définition des routes et son organisation a suivre.

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
        options: {type: "id" as "id" | "firstname"}, // valeur par défaut des options
    }
);
```

Un checker est un test unitaire, il prend en entrée une valeur et doit toujours ressortir une information et peut renvoyer une donnés. Leur but est d'être le plus flexible, plus vos checker feront des actions précises plus vos déclarations de route seront simples et rapides. Dans l'exemple ci-dessus, le checker indique prendre en entrée un nombre ou une string, il autorise comme informations de sortie: "user.exist", "user.notexist" et propose une option "type" qui dans notre cas permet de définir par quelle clé on cherche un utilisateur. 

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
        validate: (info) => info === "user.exist", // conditions de poursuite de la request
        catch: (response, info) => response.code(404).info(info).send(), //action lorsque la condition renvoie false
        output: (drop, info, data) => drop("user", data), // fonction appelée après la validation si l'exécution n'a pas été stoppé par une réponse ou autre
        options: {type: "id"} // option utiliser
    }
)
.handler((floor, response) => {
    response.code(200).info("quoicoubeh").send(floor.pickup("user"));
});
```

Ici le checker prend comme valeur d'entrée l'id qui a été précédemment drop au sol lors de l'extraction, puis il vérifie si la valeur de sortie est égal à "user.exist", si true il continue l'exécution et lance la fonction output puis le handler, si false il lance la fonction catch qui va renvoyer une erreur 404.

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
        validate: (info) => info === "user.exist",
        catch: (response, info) => response.code(404).info(info).send(),
        output: (drop, info, data) => drop("user", data),
        options: {type: "id"}
    }
)
.handler((floor, response) => {
    response.code(200).info("quoicoubeh").send(floor.pickup("user"));
});
```
Les checkers sont faits pour être utilisé à plein d'endroits mais il peut arriver d'avoir quelque chose de très spécifique qui ne se retrouvera que a un endroit, c'est pour ça que les cuts ont été créés.

**/!\ Attention à ne pas abuser des cut sinon vous vous éloignerez de de l'utilité première qui est la construction de code à base de brique réutilisable. /!\\**

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

## Construction d'une route

Il faut savoir que la déclaration d'une route à un pattern bien précis à respecter. Cet ordre imposé permettra une meilleure lisibilité après l'écriture des routes. Ce principe sera le même pour la déclaration des routes abstraites et la création de process.

```ts
duplo.declareRoute("GET", "/")
.hook(/* ... */) // vous pouvez ajouter autant de Hook que vous souhaitez.
.access(/* ... */) // vous ne pouvez avoir qu'un seul access
.extract(/* ... */) // vous ne pouvez avoir qu'un seul extract
.process(/* ... */) // vous pouvez avoir autant de process que vous souhaitez
.check(/* ... */) // vous pouvez avoir autant de check que vous souhaitez
.cut(/* ... */) // vous pouvez avoir autant de cut que vous souhaitez
.handler(/* ... */)
```

Chaque fonction en dessous d'une autre empêche de rappeler celles du dessus (sauf pour check, process et cut qui n'empêche pas de se rappeler entre eux):

```ts
duplo.declareRoute("GET", "/")

.hook(/* ... */) // vous pouvez ajouter autant de Hook que vous 
.access(/* ... */) // vous ne pouvez avoir qu'un seul access
// hook et access ne sont plus disponibles
.extract(/* ... */) // vous ne pouvez avoir qu'un seul extract
// hook, access et extract ne sont plus disponibles

.check(/* ... */) 
.process(/* ... */)
.process(/* ... */) // vous pouvez avoir autant de process, check et cut que vous voulez et dans l'ordre que vous voulez.
.cut(/* ... */) 
.check(/* ... */)

.handler(/* ... */)
```
l'ordre des process, check et cut que vous définirez sera l'ordre d'exécution des la request.

### .hook(name, function)

Les hook sont des fonctions qui sont exécutées à des moments précis du cycle de vie d'une request ou du serveur. Si les hook sont déclarés au sein d'une route il affecteront que celle-ci. Les hooks disponibles ici sont les suivants :
- **onConstructRequest**
- **onConstructResponse**
- **beforeParsingBody**
- **onError**
- **beforeSend**
- **afterSend**

**/!\ Les hooks ne sont pas fait pour répondre à une request. Si vous le faites cela provoquera une erreur. /!\\**

```ts
duplo
.declareRoute("GET", "/")
.hook("onConstructRequest", (request) => {/* ... */})
.hook("onConstructResponse", (response) => {/* ... */})
.hook("beforeSend", (request, response) => {/* ... */})
.hook("onConstructResponse", (response) => {/* ... */})
.handler((floor, response) => {
    response.code(200).info("feur").send();
});
```

### .access(function | process, {}?)

Un access accepte soit une fonction soit un process, l'acces est la pour organiser la déclaration des routes et vérifier en avant le parsing du body si la request est autorisé à être traité.

```ts
duplo
.declareRoute("POST", "/user")
.access(
    mustBeAdmin,
    {
        pickup: ["user"] // récupère la valeur user
    }
)
.handler((floor, response) => {
    response.code(200).info("pépite de chocolat").send();
});

duplo
.declareRoute("POST", "/user")
.access((floor, request, response) => {
    if(request.header.role !== "admin") response.code(403).info("for biden").send()
})
.handler((floor, response) => {
    response.code(200).info("Ancilla Domini").send();
});
```

### .extract({}, function?)
Cette fonction permet d'extraire et de vérifier des valeurs qu'on souhaite utiliser pour le traitement de la request, 4 type sont disponibles: 
- params
- body
- query
- body

```ts
duplo
.declareRoute("GET", "/user/{id}")
.access(
    mustBeAdmin,
    {
        pickup: ["user"] // récupère la valeur user
    }
)
.extract(
    {
        params: {
            id: zod.coerce.number()
        }
    },
    (response, type, index, err) => response.code(400).info("you shall not pass").send()
)
.handler((floor, response) => {
    response.code(200).info("(╯°□°）╯︵ ┻━┻").send();
});
```
### .process(process, {}?)
Cette fonction permet d'intégrer un process dans une request.

```ts
duplo
.declareRoute("GET", "/")
.extract(
    {
        params: {
            id: zod.coerce.number()
        }
    },
    (response, type, index, err) => response.code(400).info("you shall not pass").send()
)
.process(
    getUser,
    {
        pickup: ["user"], // récupère la valeur user
		input: (pickup) => pickup("id")
    }
)
.handler((floor, response) => {
    response.code(200).info("(╯°□°）╯︵ ┻━┻").send();
});
```

## Road Map
- [x] systéme de route
- [x] class pour resquest et response
- [x] ajout des checkers
- [x] déclaration des route
- [x] ajout des process 
- [x] hook sur le cycle de vie d'une request
- [x] définir des hook spécifique a une route
- [x] définir des hook spécifique a un process
- [x] content type parser avec une possibiliter de personalisation
- [x] ajout des access sur les route
- [x] ajout des route abstraite
- [x] définir des hook spécifique a une route abstraite
- [x] hook sur le cycle de vie de duplojs
- [x] ajout d'une fonction input pour faciliter le devlopement de plugins
- [ ] ajout de function "OR" et "AND" pour combiner des checker 
- [ ] unit testing mode sur les checker
- [ ] unit testing mode sur les process
- [ ] unit testing mode sur les routes
- [ ] unit testing mode sur les route abstraite
    