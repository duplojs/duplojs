# Route

## Sommaire
- [Construction d'une route](#construction-dune-route)
- [Cycle d'exécution](#cycle-dexécution)
- [Handler](#handlerfunction)
- [Extract](#extractobject-function-any)
- [Cut](#cutfunction-array-any)

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

### .cut(function, array?, ...any?)