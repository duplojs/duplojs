# DuploJS
DuploJS est un framework TypeScript/JavaScript back-end orienter fonctionnel avec un fonctionnement simple qui pourrait même être compris pars des développeur front-end ;).

Pour faire simple vos routes sont une succession de test unitaire avec au bout une action : 

```
___________________________
|                         |
|      un client beau     |
|    et plein d'argent    |<-------\
|_________________________|        |
    /|\      |                     |
	 |  	 | request http        |
	 |  	 | GET /user/{id}      |
	 |  	 |                     | negative response 
	 |  	\|/                    |
	 |    Duplojs                  |
	 |  	 |                     |
	 |  	 |_____________________| 403 
	 |  	 | has autorization    |
	 |  	 |                     |
	 |  	 |_____________________| 400
	 |  	 | params id is number |
	 |  	 |                     |
	 |  	 |_____________________| 404
	 |  	 | user exist
	 |  	 |
 200 |_______|
      response 
    containing user 
```

Cela ressemble au chemin d'une request lambda que vous auriez pu faire simplement avec express ou fastify mais **DuploJS** se différencie pars ça définition des routes et son organisation a suivre.

## Premier pas

#### Initialiser le serveur: 
```ts
import Duplo, {zod} from "@duplojs/duplojs"; // Duplojs intègre zod directement

const duplo = Duplo({port: 1506, host: "0.0.0.0"});

// Définition des routes...

duplo.launch();
```

#### Déclarer une route:
```ts
duplo
.declareRoute("GET", "/user/{id}")
.handler((floor, response) => {
	response.code(200).info("quoicoubeh").send();
})
```

Comme vous pouvez le voir vous n'avez pas accès directement à la request et **TANT MIEUX** car tel que je vous connais (bande de sagouin) vous auriez fait ça n'importe comment.

#### Comment accéder aux valeurs de la request:
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
})
```

Grâce à la fonction extracte vous pouvez à l'aide de zod extraire ce que vous souhaitez de la request et garantir le type des variables:
- le paramètre id n'acceptera qu'un nombre ou une chaîne de caractère contenant un nombre
- le champ rele du headers n'acceptera qu'une string ayant entre 2 et 15 caractères

### Comment accéder au valeurs:
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
})
```

L'objet "floor" qui représente le sol de votre chambre. Tout comme les gros nerd que nous sommes, quand on a besoin de ranger quelque chose on le jette par terre: ``floor.drop("caleçons", "sale")``, puis tu les ramasse plus tard : ``floor.pickup("caleçons")`` (c'est juste un Map qui se balade à travers toutes les fonctions d'une route). Toutes les valeurs vérifiées dans l'extract sont automatiquement "drop" sur votre sol.

### Comment faire plus de vérification:
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

Un checker est un test unitaire, il prend en entrée une valeur et doit toujours ressortir une information et peut renvoyer une donnés. Leur but est d'être le plus flexible, plus vos checker feront des actions précises plus vos déclarations de route seront simples et rapides. Dans l'exemple ci-dessus, le shaker indique prend l'entrée un nombre ou une string, autorise comme informations de sortie: "user.exist", "user.notexist" et propose une option "type" qui dans notre cas permet de définir par quelle clé on cherche un utilisateur. 

### Implémenter un checker:
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
})
```

Ici le checker prend comme valeur d'entrée l'id qui a été précédemment jeté au sol lors de l'extraction, puis il vérifie si la valeur de sortie est égal à "user.exist", si true il continue l'exécution et lance la fonction output puis le handler, si false il lance la fonction catch qui va renvoyer une erreur 404.

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
