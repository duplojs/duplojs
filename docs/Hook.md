# Hook
Les hooks sont des events auxquels on peut attacher des fonctions.

## Sommaire
- [Hook de route](#hook-de-route)
- [Hook du serveur](#hook-du-serveur)

### Hook de route
hooks|arguments|definition
---|---|---
onConstructRequest|`(Request) => {/* */}`|Se lance après l'instanciation de l'objet [Request](./Request.md).
onConstructResponse|`(Response) => {/* */}`|Se lance après l'instanciation de l'objet [Response](./Response.md).
beforeRouteExecution|`(Request, Response) => {/* */}`|Se lance avant l'exécution des opérations de la route.
parsingBody|`(Request, Response) => {/* */}`|Se lance après l'éxécution de l'abstractRoute pour pars le body.
onError|`(Request, Response, Error) => {/* */}`|Se lance si une erreur est catch pendant l'exécution des opérations de la route.
beforeSend|`(Request, Response) => {/* */}`|Se lance avant l'envoi d'une réponse.
serializeBody|`(Request, Response) => {/* */}`|Se lance après l'envoi des headers pour sérialiser le body de la réponse et l'envoyer.
afterSend|`(Request, Response) => {/* */}`|Se lance après l'envoi d'une réponse.

### Hook du serveur
hooks|arguments|definition
---|---|---
onDeclareRoute|`(route: Route) => {/* */}`|Se lance quand une route est déclarée.
onDeclareAbstractRoute|`(abstractRoute: AbstractRoute) => {/* */}`|Se lance quand une abstract route est déclarée.
onCreateChecker|`(checker: CheckerExport) => {/* */}`|Se lance quand un checker est créé.
onCreateProcess|`(process: ProcessExport) => {/* */}`|Se lance quand un process est créé.
beforeBuildRouter|`() => {/* */}`|Se lance avand que tous les objets soient figés et que le routeur soit construit.
afterBuildRouter|`() => {/* */}`|Se lance aprés que tous les objets soient figés et que le routeur soit construit.
beforeListenHttpServer|`() => {/* */}`|Se lance juste avant que le serveur web se lance.
onServerError|`(serverRequest: IncomingMessage, serverResponse: ServerResponse, error: Error) => {/* */}`|Se lance dans le cas d'une erreur synchrone qui a été throw dans une boucle supérieure. Plus de detail [ici](./Route.md#cycle-dexécution).
onReady|`() => {/* */}`|Se lance après que le serveur soit lancé.
onClose|`() => {/* */}`|Se lance quand le serveur s'arrête.

#### Retour vers le [Sommaire](#sommaire).