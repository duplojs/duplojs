# Response
Response est un object instancié pour chaque requête, il encapsule l'objet [ServerResponse](https://nodejs.org/api/http.html#class-httpserverresponse).

## Sommaire
- [Propriétés de Response](#propriétés-de-response)
- [Répondre est une erreur](#répondre-est-une-erreur)

### Propriétés de Response
propriétés|type|definition
---|---|---
rawResponse|[ServerResponse](https://nodejs.org/api/http.html#class-httpserverresponse)|Objet réponse émis par le serveur http (librairie nodejs).
code|`response.code(status: number): Response`|Fonction qui définit le status de la réponse.
status|`number`|Status de la réponse.
info|`response.code(info: string): Response`|Fonction qui définit l'information de la réponse.
information|`string` \| `undefined`|La propriété information si définie, ajoutera un en-tête `Info` qui sert à spécifier une information présise pour mieux identifier le résultat due la réponse. Personnellement j'encourage l'utilisation de ce champs.
send|`response.send(data?: any): void`|La fonction send définit la propriété data et throw l'objet `Response` pour qu'ils soient interceptés dans la suite du [cycle d'éxecution](./Route.md#cycle-dexécution).
sendFile|`response.sendFile(path: string): void`|La fonction sendFile définit la propriété file, ajoute les en-têtes appropriés et throw l'objet `Response` pour qu'il soit intercepté dans la suite du [cycle d'éxecution](./Route.md#cycle-dexécution).
download|`response.download(path: string, name?: string): void`|La fonction download définit la propriété file, ajoute les en-têtes appropriés et throw l'objet `Response` pour qu'il soit intercepté dans la suite du [cycle d'éxecution](./Route.md#cycle-dexécution).
redirect|`response.redirect(path: string): void`|La fonction redirect ajoute les en-têtes appropriés et throw l'objet `Response` pour qu'il soit intercepté dans la suite du [cycle d'éxecution](./Route.md#cycle-dexécution).
setHeaders|`response.setHeaders(headers: Record<string, string \| string[]>): Response`|Permet d'ajouter des headers à la réponse.
setHeader|`response.setHeader(index: string, value: string \| string[]): Response`|Permet d'ajouter un header à la réponse.
headers|`Record<string, string \| string[]>`|Headers de la réponse.
data|`unknown`|Données envoyées.
file|`string` \| `undefined`|Path du fichier envoyé.
isSend|`boolean`|Si true, une réponse a déjà été envoyé.

### Répondre est une erreur
Quand les fonctions send, sendFile, redirect et download sont appelées, elles créent une exception qui permet de stopper court au processus pour enchaîner sur le reste du cycle de vie de la request. Cependant, celà peut poser problème si vous appelez l'une de ces fonctions dans un try catch.

```ts
duplo
.declareRoute("GET", "/user/{id}")
// hook, extract, process, checker, cut...
.handler((floor, response) => {
    try{
        response.code(200).info("bien se passé").send();

        throw "bebou";
    }
    catch(error){
        // error === response;

        if(error instanceof Response) throw error;
    }
});
```

#### Retour vers le [Sommaire](#sommaire).