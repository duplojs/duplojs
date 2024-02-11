# Duplo instance
La DuploInstance est l'objet pricipal de duplojs, c'est à partir de lui que nous déclarons toutes les fonctionalités de duplojs.

## Sommaire
- [Avoir la DuploInstance](#avoir-la-duploinstance)
- [Propriétés de la DuploConfig](#propriétés-de-la-duploconfig)
- [Propriétés de la DuploInstance](#propriétés-de-la-duploinstance)

### Avoir la DuploInstance
```ts
import Duplo from "@duplojs/duplojs";

const duplo = Duplo({port: 1506, host: "localhost", environment: "DEV"} /* DuploConfig */);

// duplo === DuploInstance
```

### Propriétés de la DuploConfig
propriétés|type|definition
---|---|---
port|`number`|Définit le port que va utiliser le serveur.
host|`string`|Définit les adresses que le serveur va écouter. 
onLaunch|`() => void` \| `undefined`|Fonction callback qui se lancera après le lancement du serveur.
onClose|`() => void` \| `undefined`|Fonction callback qui se lancera après la fermeture du serveur.
environment|`"DEV"` \| `"PROD"`|Représente l'environnement actuel.
prefix|`string` \| `undefined`|Sert à définir un préfixe pour tous les paths de l'API.
keepDescriptions|`boolean` \| `undefined`|Si True, celà ne supprimera pas les descriptions.

### Propriétés de la DuploInstance
propriétés|type|definition
---|---|---
server|[http serveur](https://nodejs.org/api/http.html#class-httpserver)|Objet [http serveur](https://nodejs.org/api/http.html#class-httpserver).
config|[DuploConfig](#propriétés-de-la-duploconfig)|Correspont à la [config](#propriétés-de-la-duploconfig) utilisée pour obtenir l'instance.
launch|`duplo.launch(onReady?: () => void): http.server`|Fonction qui sert à lancer le serveur. Le router sera build à l'appel de cette fonction. 
addHook|`duplo.addHook(hookName: string, callback: (...args: any[]) => any): DuploInstance`|Permet d'ajouter des [Hooks](./Hook.md) de manière globale.
[declareRoute](./Route.md#déclarer-une-route)|`duplo.declareRoute(method: string, path: string \| string[]): BuilderPatternRoute`|Permet de déclarer une [route](./Route.md).
[createChecker](./Checker.md#créer-un-checker)|`duplo.createChecker(name: string, parameters: CreateCheckerParameters): CheckerExport`|Permet de créer un [checker](./Checker.md).
setNotfoundHandler|`duplo.setNotfoundHandler(notfoundCallback: (request: Request, response: Response) => void): void`|Permet de définir la fonction qui sera applée en cas de route non trouvée.
setErrorHandler|`duplo.setErrorHandler(errorCallback, (request: Request, response: Response, error: Error) => void): void`|Permet de définir la fonction qui sera applée en cas d'erreur survenue pendant l'execution des opérations d'une route.
[createProcess](./Process.md#créer-un-process)|`duplo.createProcess(name: string, params?: CreateProcessParams): BuilderPatternProcess`|Permet de créer un [process](./Process.md).
[declareAbstractRoute](./AbstractRoute.md#déclarer-une-abstract-route)|`duplo.declareAbstractRoute(name: string, params?: DeclareAbstractRouteParams): BuilderPatternAbstractRoute`|Permet de créer une [abstractRoute](./AbstractRoute.md).
[mergeAbstractRoute](./AbstractRoute.md#merge-des-abstract-route)|`duplo.mergeAbstractRoute(abstractRoute: abstractRouteInstance[]): AbstractRouteInstance`|Permet de merge plusieurs [abstractRoute](./AbstractRoute.md). Cette function existe pour fusionner des abstractRoute venant de différents [plugins](./Plugins.md), donc de favoriser la création d'abstractRoute depuis d'autres abstractRoute quand vous le pouvez.
use|`duplo.use(plugins: (instance: DuploInstance, options: object) => any, options: object): any`|Permet d'implémenter un [plugin](./Plugins.md).
routes|`Object`|Objet contenant toutes les routes de l'application. Il sera vide jusqu'à l'appel du hook `beforeBuildRouter`.
checkers|`Object`|Objet contenant tous les checkers.
processes|`Object`|Objet contenant tous les process.
abstractRoutes|`Object`|Objet contenant toutes les abstractRoutes.
plugins|`Object`|Objet contenant toutes les informations des plugins implémentés.
class|`Object`|Objet regroupant l'ensemble des classes utilisées par l'instance.

#### Retour vers le [Sommaire](#sommaire).