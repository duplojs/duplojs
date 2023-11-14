# Route

## Sommaire
- [Construction d'une route](#construction-dune-route)
- [handler](#handlerfunction)
- [extract](#extractobject-function-any)

### Construction d'une route

Il faut savoir que la déclaration d'une route à un pattern bien précis à respecter. Cet ordre imposé permettra une meilleure lisibilité après l'écriture des routes. Ce principe sera le même pour la déclaration des routes abstraites et la création de process.

```ts
duplo.declareRoute("GET", "/")
.hook(/* ... */) // vous pouvez ajouter autant de Hook que vous souhaitez.
.access(/* ... */) // vous ne pouvez avoir qu'un seul access
.extract(/* ... */) // vous ne pouvez avoir qu'un seul extract
.process(/* ... */) // vous pouvez avoir autant de process que vous souhaitez
.check(/* ... */) // vous pouvez avoir autant de check que vous souhaitez
.cut(/* ... */) // vous pouvez avoir autant de cut que vous souhaitez
.handler(/* ... */) // cette fonction marque l'arrét de la déclaration de la route
```

Chaque fonction en dessous d'une autre empêche de rappeler celles du dessus (sauf pour check, process et cut qui n'empêche pas de se rappeler entre eux):

```ts
duplo.declareRoute("GET", "/")

.hook(/* ... */) 
.hook(/* ... */) 
.access(/* ... */) // hook et access ne sont plus disponibles
.extract(/* ... */) // hook, access et extract ne sont plus disponibles
// vous pouvez avoir autant de process, check et cut que vous voulez et dans l'ordre que vous voulez.
.check(/* ... */) 
.process(/* ... */)
.process(/* ... */) 
.cut(/* ... */) 
.check(/* ... */)

.handler(/* ... */)
```
L'ordre des process, check et cut que vous définirez sera l'ordre d'exécution de la request.

### .handler(function)

### .extract(object, function?, ...any?)

La fonction extract permet de récupéret et typés des valeurs dans l'objet [Request](./Request.md). Pour extraire les valeurs il nous faut définir un schéma dans l'objet passé en premier paramètre. Les index du premier niveau correspondent à des clés de l'objet [Request](./Request.md). La librairi [zod](https://github.com/colinhacks/zod) (qui est directement intégré a duplojs) est utilisé ici pour vérifier les types.

```ts
duplo.declareRoute("PATCH", "/post/{id}")
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

duplo.declareRoute("PATCH", "/post/{id}")
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
duplo.declareRoute("PATCH", "/post/{id}")
.extract(
	{
		params: {
			id: zod.coerce.number(),
		},
	},
	(response, type, index, error) => response.code(400).info(`TYPE_ERROR.${type}${index ? "." + index : ""}`).send(),
)
.handler(({pickup}) => {
	//...
});
```