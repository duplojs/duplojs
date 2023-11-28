# Request
Request est un object instancier pour chaque requête, il encapsule l'objet [IncomingMessage](https://nodejs.org/api/http.html#class-httpincomingmessage).

### Propriétés de Request
propriétés|type|definition
---|---|---
rawRequest|[IncomingMessage](https://nodejs.org/api/http.html#class-httpincomingmessage)|Objet requéte émit par le serveur nodejs.
method|`"GET"` \| `"POST"` \| `"PUT"` \| `"PATCH"` \| `"DELETE"` \| `"OPTIONS"` \| `"HEAD"`|Method de la requéte actuel.
headers|`Record<string, string \| string[]>`|Headers de la requéte actuel.
url|`string`|Url de la requéte actuel.
host|`string`|Host de la requéte actuel.
origin|`string`|Origin de la requéte actuel.
path|`string`|Path de la requéte actuel.
params|`Record<string, string>`|Paramétre éxtrai du path de la requéte actuel.
query|`Record<string, string \| string[]>`|Query de la requéte actuel.
matchedPath|`string` \| `null`|Path qui a machté avec la requéte actuel. Exemple: path === "/user/953" donc matchedPath === "/user/{userId}". si aucune route n'est trouvé, alors la valeur sera a null.
body|`unknown`|Body de la requéte actuel.