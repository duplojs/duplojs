# Response
Response est un object instancier pour chaque requête, il encapsule l'objet [ServerResponse](https://nodejs.org/api/http.html#class-httpserverresponse).

### Propriétés de Response
propriétés|type|definition
---|---|---
rawResponse|[ServerResponse](https://nodejs.org/api/http.html#class-httpserverresponse)|Objet réponse émit par le serveur nodejs.
code|`response.code(status: number): Response`|Function qui définit le status de la réponse.
status|`number`|Status de la réponse.
info|`response.code(info: string): Response`|Function qui définit l'information de la réponse.
information|`string` \| `undefined`|La propriété information si définit ajoutera une en-tête `Info` qui serre a spécifier une information présise pour mieux identifier le résulta du réponse. Personelment j'encorage l'utilisation de ce champs.
send|`response.send(data?: any): void`|La function send définit la propriété data et throw l'objet `Response` pour qu'il sois intercepté dans le cycle de vie de la requéte.
sendFile|`response.sendFile(path: string): void`|
download|`response.download(path: string, name?: string): void`|
redirect|`response.redirect(path: string): void`|
setHeaders|`response.setHeaders(headers: Record<string, string \| string[]>): Response`|
setHeader|`response.setHeader(index: string, value: string \| string[]): Response`|
headers|`Record<string, string \| string[]>`|
data|`unknown`|
isSend|`boolean`|