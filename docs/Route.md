# Route

## Sommaire
- [Déclarer une route](#déclarer-une-route)
- [Construction d'une route](#construction-dune-route)
- [Exécution linéaire](#exécution-linéaire)
- [Cycle d'exécution](#cycle-dexécution)
- [Handler](#handlerfunction-any)
- [Extract](#extractobject-function-any)
- [Check](#checkobject-object-any)
- [Cut](#cutfunction-array-any)
- [Process](#processobject-object-any)
- [Hook](#hookstring-function)

### Déclarer une route
Une route peut étre déclaré a partire de deux chose, sois depuis la `DuploInstance`, sois depuis une `AbstractRouteInstance`.

```ts
duplo.declareRoute("GET", "/")//...
//or
duplo.declareRoute("POST", ["/user", "/post"])//...
```
Le premier argument est une `string` qui représente la method de la route, les seule valeur possible sont `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` ou `HEAD`. Le second argument est sois une `string` sois une `Array<string>`, il représente tout les path qui seront accosier a la route.

### Construction d'une route
La déclaration d'une route à un pattern bien précis à respecter. Cet ordre imposé permettra une meilleure lisibilité. Ce principe sera le même pour la déclaration des routes abstraites et la création de process.

```ts
duplo
.declareRoute("GET", "/")
.hook(/* ... */) // vous pouvez ajouter autant de Hook que vous souhaitez
.extract(/* ... */) // vous ne pouvez avoir qu'un seul extract
.process(/* ... */) // vous pouvez avoir autant de process que vous souhaitez
.check(/* ... */) // vous pouvez avoir autant de check que vous souhaitez
.cut(/* ... */) // vous pouvez avoir autant de cut que vous souhaitez
.handler(/* ... */) // cette fonction marque l'arrét de la déclaration de la route
```

Chaque fonction en dessous d'une autre empêche de rappeler celles du dessus (sauf pour check, process et cut qui n'empêche pas de se rappeler entre eux):

```ts
duplo
.declareRoute("GET", "/")

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
```
L'ordre des process, check et cut que vous définirez sera l'ordre d'exécution de la request.

### Exécution linéaire
Pour que Duplojs fonctionne correctement, il faut respecter son exécution. Une request a un chemin synchronisé et des étapes à franchir. Si vous souhaitez utiliser une réponse après une promesse, il vous faudra toujours utiliser await pour que l'exécution se fasse de manière linéaire.

```ts
duplo
.declareRoute("GET", "/user/{id}")
// hook, extract, process, checker, cut...
.handler(async (floor, response) => {

    // ✖ ne fonctionne pas
    // cela provoquera une erreur qui indiquera que rien n'a été envoyé
    new Promise(resolve => setTimeout(resolve, 1000))
    .then(() => response.code(200).info("j'effectue le dab").send());

    // ✔ fonctionne correctement
    // l'exécution est en linéaire donc cela ne posera aucun problème
    await new Promise(resolve => setTimeout(resolve, 1000));
    response.code(200).info("il est mort pioupiou").send();
});
```

### Cycle d'exécution
Les route de duplojs son grosomodo des succesion d'execution de function ([Hook](./Hook.md), [AbstractRoute](./AbstractRoute.md), [Process](./Process.md), [Checker](./Checker.md), ...). Pour optimiser le raccord des différente fonction, duplojs fabrique une fonction surmesure. C'est donc cette fonction qui determine le cycle d'exécution.

Ordres d'appel des fonctions:
- [Hook](./Hook.md) "onConstructRequest"
- [Hook](./Hook.md) "onConstructResponse"
- [Hook](./Hook.md) "beforeRouteExecution"
- Make[Floor](./Floor.md)
- [AbstractRoute](./AbstractRoute.md)
- [Hook](./Hook.md) "beforeParsingBody"
- [Content Type Parser](./ContentTypeParser.md)
- [Extract](#extractobject-function-any)
- [Process](./Process.md), [Checker](./Checker.md) ou [cut](#cutfunction-array-any)
- [Handler](#handlerfunction-any)
- [Hook](./Hook.md) "beforeSend"
- Envoi de la réponse
- [Hook](./Hook.md) "afterSend"

Comme dit plus haut la fonction est sur mesure donc tout ne vas pas forcément s'exécuter mais tout s'executera dans cette ordre.

Il n'est pas possible d'envoyer une réponse a n'importe qu'elle moment du cycle, le "code" si dessous montre de manier plus technique le cycle d'exécution.

```
// try serveur
try{
	@ touve une route qui match
	@ lance le hook onConstructRequest
	@ lance le hook onConstructResponse

	// try response
	try{
		// try erreur
		try{
			@ lance le hook beforeRouteExecution
			@ exécute abstract route
			@ lance le hook beforeParsingBody
			@ lance le content type parser
			@ exécute extract, checker, cut, process, handler
		}
		// catch error
		catch(exception) {
			if(exception === Error){
				@ lance le hook OnError
				@ execute error handler
			}
			else {
				@ throw exception;
			}
		}
	}
	// catch response
	catch(exception) {
		if(exception === Reponse){
			@ lance le hook beforeSend
			@ envoi la Reponse au client
			@ lance le hook afterSend
		}
		else {
			@ throw exception;
		}
	}
}
// catch serveur
catch(exception) {
	@ lance le hook onServerError
	@ envoi une Erreur 500 au client
}

```
Les différent trycatch serve de "goto" (d'ou l'exuction linéaire), cela permet d'intérompre l'éxécution du code de pandent les opération de la route. Cependent si une réponse est envoyer depuis le try serveur ou le catch reponse ça provoquera une erreur.

### .handler(function, ...any?)
```ts
duplo
.declareRoute("GET", "/")
.handler((floor, response) => {
	response.send("fait le mou, fait le mou");
});
```
La fonction handler est la fonction qui cloture la définition d'une route. Elle prend en argument une fonction. Cette fonction est appler avec 2 arguments, le [floor](./Floor.md) de la requête et l'objet [Response](./Response.md). Cette fonction est la dernierre action de la route, en théoris une fois arriver ici il n'y a plus rien a vérifier ! 

**⚠️ Si la fonction handler n'est pas appler la route n'est pas déclaré. ⚠️**

### .extract(object, function?, ...any?)
La fonction extract permet de récupéret et typés des valeurs dans l'objet [Request](./Request.md). Pour extraire les valeurs il nous faut définir un schéma dans l'objet passé en premier paramètre. Les index du premier niveau correspondent à des clés de l'objet [Request](./Request.md). La librairi [zod](https://github.com/colinhacks/zod) (qui est directement intégré a duplojs) est utilisé ici pour vérifier les types.

```ts
duplo
.declareRoute("PATCH", "/post/{id}")
.extract({
	params: {
		id: zod.number(), // max deep
	},
	body: zod.object({ // min deep
		title: zod.string().max(10).min(2).optinal(),
		subtitle: zod.string().max(150).optinal(),
		text: zod.string().max(1500).optinal(),
	})
})
.handler(({pickup}) => {
	pickup("id"); // id en paramétre
	pickup("body"); // body de la request

	//...
});

// equal to

duplo
.declareRoute("PATCH", "/post/{id}")
.extract({
	params: {
		id: zod.coerce.number(),
	},
	body: {
		title: zod.string().max(10).min(2).optinal(),
		subtitle: zod.string().max(150).optinal(),
		text: zod.string().max(1500).optinal(),
	},
})
.handler(({pickup}) => {
	pickup("id"); // id en paramétre
	pickup("title"); // title du body de la request
	pickup("subtitle"); // subtitle du body de la request
	pickup("text"); // text du body de la request

	//...
});
```

En cas d'erreur de type une réponse est directement envoyée et l'exécution du code s'arrête à la fonction extract. Par défaut l'erreur a un code 400 et porte l'info `TYPE_ERROR.${type}[.${index}]`. Si vous souhaitez modifier le type de retour il vous suffit de passer une fonction en second paramètre.

```ts
duplo
.declareRoute("PATCH", "/post/{id}")
.extract(
	{
		params: {
			id: zod.coerce.number(),
		},
	},
	(response, type, index, error) => 
		response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send(),
)
.handler(({pickup}) => {
	//...
});
```

La fonction en second paramètre prend 4 argument, l'object [Response](./Response.md), la clé de premier niveau (type), la clé de second niveau (index) et l'erreur zod. 

### .check(object, object, ...any?)
La method check permet d'implémenter un [checker](./Checker.md) dans une route. Elle prends 2 arguments, le premier est de type `CheckerExport` et le second est un objet qui permet de configuré le checker implémenter.

```ts
duplo
.declareRoute("GET", "/user/{id}")
.extract({
    params: {
        id: zod.coerce.number()
    },
	query: {
		type: zod.enum(["id", "firstname"]).optional()
	}
})
.check(
    userExist,
    {
        input: (pickup) => pickup("id"), // valeur d'entrée
        result: "user.exist", // info attendu pour continuer
        catch: (response, info) => response.code(404).info(info).send(), // action effectuer si l'info n'est pas c'elle attendu
        indexing: "user", // index de drop du resulta

        options: {type: "id"} // option static
		// or
		options: (pickup) => ({ // option dynamique
			type: pickup("type")
		})
    }
)
.handler(({pickup}, response) => {
    response.send(pickup("user"));
});
```

Les propriéter `input` et `options` ce ressemble, elle serve toute les deux a envoyer des donnés pour l'exécution du checker. Cependant `input` doit obligatoirment étre défini contrairement aux `options` qui ont des valeurs par défaut. La propriété `result` représente l'information attendue, si le checker renvoie une autre information la fonction de la propriété `catch` sera lancée ce qui interrompera la requête. La propriété `indexing` représente la clé d'indexation dans floor de la data résultante du checker.

propriétés|valeur|definition
---|---|---
input|`function`|Fonction qui permet d'envoyer une valeur au checker.
result|`string` ou `string[]` ou `undefined`|Information attendu pour continuer la requéte.
catch|`function`|Function appler si le resulta ne convient pas.
indexing|`string` ou `undefined`|Propriété qui représente l'index dans le [floor](./Floor.md) des data renvoyées par le checker en cas de resultat satisfaisant.
options|`function` ou `objet` ou `undefined`|Options du checker.
skip|`function` ou `undefined`|Propriété de sauter un checker sous certaine condition.

### .cut(function, array?, ...any?)
La fonction cut est conseiller d'étre utiliser dans deux cas. Si vous avez une vérification unique qui ne sera utile que sur une seul route ou si vous avez besoin de manipuler l'objet [Request](./Request.md). La method cut prend 2 arguments, le premier est une fonction et le second argument est une array. L'array correspond explicitement au clé de l'objet renvoyer par la fonction.

```ts
duplo
.declareRoute("POST", "/video/{id}/comment")
.extract({
	params: {
		id: zod.coerce.number(),
	},
	body: {
		content: zod.string().max(240).min(1),
	}
})
.check(
    videoExist,
    {
        input: (pickup) => pickup("id"),
        result: "video.exist",
        catch: (response, info) => response.code(404).info(info).send(),
        indexing: "video",
    }
)
.cut(
	({pickup}, response, request) => {
		const dateVideo = pickup("video").date;
		const dateComment = new Date();
		
		const fiveDayInMilisecond = 432000000;

		if(dateComment.getTime() - dateVideo.getTime() > fiveDayInMilisecond) {
			response.code(400).send();
		}

		return {
			dateComment
		}
	}, 
	["dateComment"]
)
.handler(async ({pickup}, response) => {
	const result = await myDataBase.comment.inserte({
		video_id: pickup("id"),
		date: pickup("dateComment"),
		content: pickup("content")
	});

    response.send(result);
});
```
La fonction sera appler avec 3 argument, le premier c'est le [floor](./Floor.md) de la requête, le second c'est l'objet [Response](./Response.md) et le troisiéme c'est l'objet [Request](./Request.md).

### .process(object, object, ...any?)
La fonction process permet d'implémenter un process dans une route. Cette method prend 2 argument, le premier est de type `ProcessExport` et le second est un objet qui permet de configuré le process implémenter.

```ts
duplo
.declareRoute("PATCH", "/article/{articleId}")
.extract({
	params: {
		articleId: zod.coerce.number(),
	},
	body: {
		title: zod.string().max(120).min(5).optinal(),
		subTitle: zod.string().max(240).min(5).optinal(),
		content: zod.string().max(1500).min(1).optinal(),
	}
})
.check(
	articleExist,
	{
		input: (pickup) => pickup("articleId"),
		result: "article.exist",
		catch: (response, info) => response.code(404).info(info).send(),
		indexing: "article",
	}
)
.process(
	userHasRightInOrganization,
	{
		input: (pickup) => pickup("article").organization_id,
		pickup: ["currentUser"], // valeur récupérer du process

		options: { // option static
			right: "edit_post"
		}
		// or
		options: (pickup) => ({ // option dynamique
			right: "edit_post"
		})
	}
)
.handler(async ({pickup}, response) => {
	const result = await myDataBase.article.update({
		id: pickup("articleId"),
		title: pickup("title"),
		subTitle: pickup("subTitle"),
		content: pickup("content"),
		editer_id: pickup("currentUser").id
	});

    response.send(result);
});
```
Les propriétés `input` et `options` permettent de passer des données pour l'éxécution du process, mais elles ne sont pas obligatoires. La propriété `pickup` permet de récupérer des valeurs du [floor](./Process.md) du process.

propriétés|valeur|definition
---|---|---
input|`function` ou `undefined`|Fonction qui permet d'envoyer une valeur au process.
pickup|`string[]` ou `undefined`|Cette propriété représente des clé du [floor](./Floor.md) du process qui on êtais drop, cela permet d'importer leur valeur dans la route.
options|`function` ou `objet` ou `undefined`|Options du process.
skip|`function` ou `undefined`|Propriété de sauter un process sous certaine condition.

### .hook(string, function)
La fonction hook permet d'ajouter des [hooks](./Hook.md) localment a une route.

```ts
duplo
.declareRoute("GET", "/")
.hook("onConstructRequest", (request) => {/* ... */})
.hook("beforeParsingBody", (request, response) => {/* ... */})
.hook("onError", (request, response, error) => {/* ... */})
.hook("beforeParsingBody", (request, response) => {/* ... */})
.handler(/* ... */);
```

hook|arguments|definition
---|---|---
onConstructRequest|`(Request) => {/* */}`|Ce lance aprés l'instanciation de l'objet [Request](./Request.md).
onConstructResponse|`(Response) => {/* */}`|Ce lance aprés l'instanciation de l'objet [Response](./Response.md).
beforeRouteExecution|`(Request, Response) => {/* */}`|Ce lance avant l'éxécution des opération de la route.
beforeParsingBody|`(Request, Response) => {/* */}`|Ce lance avant le [content type parser](./ContentTypeParser.md) dans le cas ou la clés "body" est dans l'[extract](#extractobject-function-any).
onError|`(Request, Response, Error) => {/* */}`|Ce lance si une erreur est catch pendant l'execution des opération de la route.
beforeSend|`(Request, Response) => {/* */}`|Ce lance avant avant l'envois d'un réponse.
afterSend|`(Request, Response) => {/* */}`|Ce lance aprés l'envois d'un réponse.

Vous pouvez avoir plus de detaile avec le [cycle d'exécution](#cycle-dexécution) ou sur la page [Hook](./Hook.md).

#### Retour vers le [Sommaire](#sommaire).