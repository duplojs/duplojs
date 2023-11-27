# Duplo instance
La DuploInstance est l'objet pricipal de duplojs, c'est a partire de lui que nous déclaront toute les fonctionaliter de duplojs.

## Sommaire
- [Avoir la DuploInstance](#avoir-la-duploinstance)
- [Propriétés de la DuploConfig](#propriétés-de-la-duploconfig)
- [Propriétés de la DuploInstance](#propriétés-de-la-duploinstance)

### Avoir la DuploInstance
```ts
import Duplo from "@duplojs/duplojs";

const duplo = Duplo({port: 1506, host: "0.0.0.0"} /* DuploConfig */);

// duplo === DuploInstance
```

### Propriétés de la DuploConfig
propriétés|type|definition
---|---|---
port|`number`|Définit le port que vas utilisais le serveur.
host|`string`|Définit les adresses que le server vas écouter. 
onLaunch|`() => void` \| `undefined`|Fonction callback qui ce lancera aprés le lancement du serveur.
onClose|`() => void` \| `undefined`|Fonction callback qui ce lancera aprés la fermeture du serveur.
environment|`"DEV"` \| `"PROD"` \| `undefined`|Représente l'environment actuel.
prefix|`string` \| `undefined`|Serre a définir un préfix pour tout les path de l'API.
keepDescriptions|`boolean` \| `undefined`|Si True, cela ne supprimera pas les descriptions.
rebuildRoutes|`boolean` \| `undefined`|Si True, rebuildera toute les route avant la fabrication du routeur.

### Propriétés de la DuploInstance
propriétés|type|definition
---|---|---
Request|[Request](./Request.md)|Fait référence a l'objet [Request](./Request.md).
Response|[Response](./Response.md)|Fait référence a l'objet [Response](./Response.md).
server|[http serveur](https://nodejs.org/api/http.html#class-httpserver)|Objet [http serveur](https://nodejs.org/api/http.html#class-httpserver).
config|[DuploConfig](#propriétés-de-la-duploconfig)|Correspont a la [config](#propriétés-de-la-duploconfig) utilisé pour obtenir l'instance.
launch|`duplo.launch(onReady?: () => void): http.server`|Fonction qui serre a lancer le serveur. Le router sera build a l'appel de cette fonction. 
addHook|`duplo.addHook(hookName: string, callback: (...args: any[]) => any): DuploInstance`|Permet d'ajouter des [Hooks](./Hook.md) de manier global.
declareRoute|`duplo.declareRoute(method: string, path: string \| string[]): BuilderPatternRoute`|Permet de déclaré une [route](./Route.md).
createChecker|`duplo.createChecker(name: string, parameters: CreateCheckerParameters): CheckerExport`|Permet de créée un [checker](./Checker.md).
setNotfoundHandler|`duplo.setNotfoundHandler(notfoundCallback: (request: Request, response: Response) => void): void`|Permet de dénire la fonction qui sera applé en cas de route non trouvé.
setErrorHandler|`duplo.setErrorHandler(errorCallback, (request: Request, response: Response, error: Error) => void): void`|Permet de définire la fonction qui sera applé en cas d'erreur survenu pendan l'execution des opération d'une route.
createProcess|`duplo.createProcess(name: string, params?: CreateProcessParams): BuilderPatternProcess`|Permet de créée de un [process](./Process.md).
addContentTypeParsers|`duplo.addContentTypeParsers(patterne: string \| RegExp, parseFunction: (request: Request) => void): void`|Permet d'ajouter a un [contentTypeParsers](./ContentTypeParser.md).
declareAbstractRoute|`duplo.declareAbstractRoute(name: string, params?: DeclareAbstractRouteParams): BuilderPatternAbstractRoute`|Permet de créée une [abstractRoute](./AbstractRoute.md).
mergeAbstractRoute|`duplo.mergeAbstractRoute(abstractRoute: abstractRouteInstance[]): AbstractRouteInstance`|Permet de merge plusieur [abstractRoute](./AbstractRoute.md). Cette function existe pour fusioner des abstractRoute venant de diférent [plugins](./Plugins.md), donc favorisé la création d'abstractRoute depuis d'autre quand vous le pouvais.
use|`duplo.use(plugins: (instance: DuploInstance, options: object) => any, options: object): any`|Permet d'implémenté un [plugin](./Plugins.md).
routes|`Object`|Objet contenant toute les route de l'application. Il sera vide jusqu'à l'appel du hook `beforeBuildRouter`.
checkers|`Object`||Objet contenant toute les checkers.
processes|`Object`||Objet contenant toute les process.
abstractRoutes|`Object`||Objet contenant toute les abstractRoutes.
plugins|`Object`||Objet contenant toute les plugins implémenter

#### Retour vers le [Sommaire](#sommaire).