# Hook
les Hook son des fonction qui son assigner a des evénement.

## Sommaire
- [Hook de route](#hook-de-route)
- [Hook du serveur](#hook-du-serveur)

### Hook de route
hooks|arguments|definition
---|---|---
onConstructRequest|`(Request) => {/* */}`|Ce lance aprés l'instanciation de l'objet [Request](./Request.md).
onConstructResponse|`(Response) => {/* */}`|Ce lance aprés l'instanciation de l'objet [Response](./Response.md).
beforeRouteExecution|`(Request, Response) => {/* */}`|Ce lance avant l'éxécution des opération de la route.
beforeParsingBody|`(Request, Response) => {/* */}`|Ce lance avant le [content type parser](./ContentTypeParser.md) dans le cas ou la clés "body" est dans l'[extract](#extractobject-function-any).
onError|`(Request, Response, Error) => {/* */}`|Ce lance si une erreur est catch pendant l'execution des opération de la route.
beforeSend|`(Request, Response) => {/* */}`|Ce lance avant avant l'envois d'un réponse.
afterSend|`(Request, Response) => {/* */}`|Ce lance aprés l'envois d'un réponse.

### Hook du serveur
hooks|arguments|definition
---|---|---
onDeclareRoute|`(route: Route) => {/* */}`|Ce lance quand une route est déclaré.
onDeclareAbstractRoute|`(abstractRoute: AbstractRoute) => {/* */}`|Ce lance quand une abstract route est déclaré.
onCreateChecker|`(checker: CheckerExport) => {/* */}`|Ce lance quand un checker est créer.
onCreateProcess|`(process: ProcessExport) => {/* */}`|Ce lance quand un process est créer.
beforeBuildRouter|`() => {/* */}`|Ce lance avand que tout les objet sois figer et que le routeur sois construit.
onServerError|`(serverRequest: IncomingMessage, serverResponse: ServerResponse, error: Error) => {/* */}`|Ce lance dans le cas d'une erreur sychrone qui a étais throw dans une boucle suppérieur. Plus de detail [ici](./Route.md#cycle-dexécution).
onReady|`() => {/* */}`|Ce lance quand aprés que le serveur sois lancer.
onClose|`() => {/* */}`|ce lance quand le serveur s'arréte.

#### Retour vers le [Sommaire](#sommaire).