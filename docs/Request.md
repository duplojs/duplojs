# Request
Request est un object instancié pour chaque requête, il encapsule l'objet [IncomingMessage](https://nodejs.org/api/http.html#class-httpincomingmessage).

### Propriétés de Request
propriétés|type|definition
---|---|---
rawRequest|[IncomingMessage](https://nodejs.org/api/http.html#class-httpincomingmessage)|Objet requête émis par le serveur http (librairie nodejs).
method|`"GET"` \| `"POST"` \| `"PUT"` \| `"PATCH"` \| `"DELETE"` \| `"OPTIONS"` \| `"HEAD"`|méthode de la requête actuelle.
headers|`Record<string, string \| string[]>`|Headers de la requête actuelle.
url|`string`|Url de la requête actuelle.
host|`string`|Host de la requête actuelle.
origin|`string`|Origine de la requête actuelle.
path|`string`|Path de la requête actuelle.
params|`Record<string, string>`|Paramètre extrait du path de la requête actuelle.
query|`Record<string, string \| string[]>`|Query de la requête actuelle.
matchedPath|`string` \| `null`|Path qui a matché avec la requête actuelle. Exemple: path === "/user/953" donc matchedPath === "/user/{userId}". si aucune route n'est trouvée, alors la valeur sera null.
body|`unknown`|Body de la requête actuelle.