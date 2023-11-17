# Route

## Sommaire
- [Construction d'une route](#construction-dune-route)
- [Cycle d'exécution](#cycle-dexécution)
- [Handler](#handlerfunction-any)
- [Extract](#extractobject-function-any)
- [Check](#checkobject-object-any)
- [Cut](#cutfunction-array-any)
- [Process](#processobject-object-any)
- [Hook](#hookstring-function)

### Construction d'une route
Il faut savoir que la déclaration d'une route à un pattern bien précis à respecter. Cet ordre imposé permettra une meilleure lisibilité après l'écriture des routes. Ce principe sera le même pour la déclaration des routes abstraites et la création de process.

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

### Cycle d'exécution
Les route de duplojs son grosomodo des succesion d'execution de function ([Hook](./Hook.md), [AbstractRoute](./AbstractRoute.md), [Process](./Process.md), [Checker](./Checker.md), ...). Pour optimiser le raccord des différente fonction, duplojs fabrique une fonction surmesure. C'est donc cette fonction qui determine le cycle d'exécution.

Ordres d'appel des fonctions:
- [Hook](./Hook.md) "onConstructRequest"
- [Hook](./Hook.md) "onConstructResponse"
- [Hook](./Hook.md) "beforeRouteExecution"
- Make[Floor](./Floor.md)
- [AbstractRoute](./AbstractRoute.md)
- [Hook](./Hook.md) "beforeParsingBody"
- [Content type Parser](./ContentTypeParser.md)
- [Extract](#extractobject-function-any)
- [Process](./Process.md), [Checker](./Checker.md) ou [cut](#cutfunction-array-any)
- [Handler](#handlerfunction)

Comme dit plus haut la fonction est sur mesure donc tout ne vas pas forcément s'exécuter mais tout s'executera dans cette ordre.

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
La method check permet d'implémenter un [checker](./Checker.md) dans une route. Elle prends 2 arguments, le premier est de type `checkerExport` et le second est un objet qui permet de configuré le checker implémenter.

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

Les propriéter `input` et `options` ce ressemble, elle serve toute les deux a envoyer des donnés pour l'exécution du checker. Cependant `input` doit obligatoirment étre défini contrairement aux `options` qui ont des valeurs par défaut. La propriété `result` représente l'information attendue, si le checker renvoie une autre information la fonction de la propriété `catch` sera lancée ce qui interrompera la requête. La propriété indexing représente la clé d'indexation dans floor de la data résultante du checker.

### .cut(function, array?, ...any?)
La fonction cut est conseiller d'étre utiliser dans deux cas. Si vous avez une vérification unique qui ne sera utile que sur une seul route ou si vous avez besoin de manipuler l'objet [Request](./Request.md).
La method cut prend 2 arguments, le premier est une fonction et le second argument est une array. L'array correspond explicitement au clé de l'objet renvoyer par la fonction.

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
```ts
duplo
.declareRoute("PATCH", "/organization/{organizationId}/post/{postId}")
.extract({
	params: {
		organizationId: zod.coerce.number(),
		postId: zod.coerce.number(),
	},
	body: {
		title: zod.string().max(120).min(5),
		subTitle: zod.string().max(240).min(5),
		content: zod.string().max(1500).min(1),
	}
})
.process(
	userHasRightInOrganization,
	{
		input: (pickup) => pickup("organizationId"),
		pickup: ["currentUser", "organization"], // valeur récupérer du process

		options: { // option static
			right: "publish_post"
		}
		// or
		options: (pickup) => ({ // option dynamique
			right: "publish_post"
		})
	}
)
.handler(async ({pickup}, response) => {
	const result = await myDataBase.post.inserte({
		organization_id: pickup("organizationId"),
		author_id: pickup("currentUser").id
		title: pickup("title"),
		subTitle: pickup("subTitle"),
		content: pickup("content"),
		date: new Date(),
	});

    response.send(result);
});
```

### .hook(string, function)