# Content Type Parser
Content Type Parser est un systéme créer pour analiser le contenu des body reçu a partire le l'entéte `content-type`. Pars défaut le json et le text est interpréter.

```ts
duplo.addContentTypeParsers(
    "application/xml", // content-type === application/xml
    (request) => new Promise(
        (resolve, reject) => {
            let stringBody = "";
            request.rawRequest.on("error", reject);
            request.rawRequest.on("data", chunck => stringBody += chunck);
            request.rawRequest.on("end", () => {
                request.body = XML.parse(stringBody);
                resolve();
            });
        }
    )
);

// OR

duplo.addContentTypeParsers(
    /yaml/, // content-type match with /yaml/
    (request) => new Promise(
        (resolve, reject) => {
            let stringBody = "";
            request.rawRequest.on("error", reject);
            request.rawRequest.on("data", chunck => stringBody += chunck);
            request.rawRequest.on("end", () => {
                request.body = YAML.parse(stringBody);
                resolve();
            });
        }
    )
);
```

La methode `addContentTypeParsers` est une propriéter de la [duploInstance](./DuploInstance.md). Elle as deux argument, le premier est sois une `string`, sois une `RegEx` et le deuxiéme est une fonction async.