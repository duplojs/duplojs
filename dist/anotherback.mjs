import http from 'http';
import { existsSync, createReadStream } from 'fs';
import mime from 'mime';
import { basename } from 'path';
import zod, { ZodError } from 'zod';
export { z as zod } from 'zod';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';

function makeHooksSystem(eventsName) {
  const hooks = {};
  const buildedHooks = {};
  eventsName.forEach((name) => hooks[name] = []);
  return {
    addHook(name, hookFunction) {
      if (!hooks[name])
        throw new Error();
      hooks[name].push(hookFunction);
    },
    buildHooks() {
      Object.entries(hooks).forEach(([key, value]) => {
        let stringFunction = "";
        let isAsync = false;
        value.forEach((fnc, index) => {
          if (fnc.constructor.name === "AsyncFunction") {
            stringFunction += /* js */
            `
							await hooks.${key}[${index}](req, res, data);
						`;
            isAsync = true;
          } else
            stringFunction += /* js */
            `
						hooks.${key}[${index}](req, res, data);
					`;
        });
        buildedHooks[key] = eval((isAsync ? "async" : "") + /* js */
        `(req, res, data) => {${stringFunction}}`);
      });
    },
    launchHooks(name, request, response, data) {
      if (!buildedHooks[name])
        throw new Error();
      return buildedHooks[name](request, response, data);
    },
    copyHook(otherHooks, from, to) {
      hooks[to] = [...hooks[to], ...otherHooks[from]];
    },
    hooks,
    buildedHooks
  };
}

function extractPathAndQueryFromUrl(url) {
  if (!url)
    return { path: "/" };
  if (url[0] !== "/")
    url = "/" + url;
  let [path, query] = url.split("?");
  path = path.endsWith("/") && path.length !== 1 ? path.slice(0, -1) : path;
  if (query) {
    const queryObj = {};
    new URLSearchParams(query).forEach((value, key) => queryObj[key] = value);
    return {
      path,
      query: queryObj
    };
  } else
    return { path };
}

function makeRequest(request, config) {
  const extracted = extractPathAndQueryFromUrl(request.url);
  return {
    rawRequest: request,
    get method() {
      return request.method;
    },
    getHeader(key) {
      return request.headers[key.toLowerCase()];
    },
    getHeaders() {
      return request.headers;
    },
    get url() {
      return request.url || "";
    },
    get host() {
      return request.headers.host || "";
    },
    get origin() {
      return request.headers.origin || "";
    },
    cookies: {},
    path: extracted.path,
    query: extracted.query || {},
    params: {}
  };
}

const __exec__ = Symbol("exec");
class ResponseInstance {
}
function makeResponse(response, config) {
  let _code = 200;
  let _info;
  let _headers = {};
  let _isSend = false;
  let _cookies = {};
  return {
    rawResponse: response,
    code(status) {
      _code = status;
      return this;
    },
    get status() {
      return _code;
    },
    info(info) {
      _info = info;
      return this;
    },
    send(data) {
      if (_isSend === true) {
        console.error(new Error("A response has already been sent."));
        return;
      }
      _isSend = true;
      this.data = data;
      if (_info)
        _headers.info = _info;
      throw this;
    },
    sendFile(path) {
      if (_isSend === true) {
        console.error(new Error("A response has already been sent."));
        return;
      }
      _isSend = true;
      if (!existsSync(path))
        this.code(404).info("FILE.NOTFOUND").send();
      this.file = path;
      if (_info)
        _headers.info = _info;
      _headers["content-type"] = mime.getType(path) || "text/plain";
      throw this;
    },
    download(path, name) {
      if (_isSend === true) {
        console.error(new Error("A response has already been sent."));
        return;
      }
      _isSend = true;
      if (!existsSync(path))
        this.code(404).info("FILE.NOTFOUND").send();
      this.file = path;
      if (_info)
        _headers.info = _info;
      _headers["content-type"] = "application/octet-stream";
      _headers["Content-Disposition"] = "attachment; filename=" + (name || basename(path));
      throw this;
    },
    getHeaders() {
      return _headers;
    },
    getHeader(index) {
      return _headers[index.toLowerCase()];
    },
    setHeaders(headers) {
      _headers = {};
      Object.entries(headers).forEach(([index, value]) => _headers[index.toLowerCase()] = value);
      return this;
    },
    setHeader(index, value) {
      _headers[index.toLowerCase()] = value;
      return this;
    },
    setCookie(name, value, params = {}) {
      _cookies[name] = { value, params };
      return this;
    },
    deleteCookie(name, params = { path: "/" }) {
      params.expires = /* @__PURE__ */ new Date(0);
      params.maxAge = void 0;
      _cookies[name] = { value: "", params };
      return this;
    },
    get cookies() {
      return _cookies;
    },
    data: void 0,
    file: void 0,
    get isSend() {
      return _isSend;
    },
    [__exec__]() {
      try {
        response.writeHead(_code, _headers);
        if (this.data)
          response.write(this.data);
        else if (this.file) {
          createReadStream(this.file).pipe(response);
          return;
        }
        response.end();
      } catch (error) {
        _isSend = false;
        throw error;
      }
    },
    [Symbol.hasInstance](instance) {
      return instance?.name === "ResponseInstance";
    }
  };
}

function makeFloor() {
  const floor = {};
  function pickup(index) {
    return floor[index];
  }
  function drop(index, value) {
    floor[index] = value;
  }
  return {
    pickup,
    drop
  };
}

function makeRoutesSystem(config, mainHooks) {
  const routes = {
    GET: {},
    POST: {},
    PUT: {},
    PATCH: {},
    DELETE: {},
    OPTIONS: {},
    HEAD: {}
  };
  const buildedRoutes = {};
  let notfoundHandlerFunction = (request, response) => {
    return response.code(404).info("NOTFOUND").send(`${request.method}:${request.path} not found`);
  };
  return {
    declareRoute(method, path) {
      path = config.prefix + extractPathAndQueryFromUrl(path).path;
      const { addHook, buildHooks, launchHooks, copyHook } = makeHooksSystem(["error", "beforeSent", "afterSent"]);
      let hasHook = false;
      const hook = (name, hookFunction) => {
        if (hasHook === false) {
          hasHook = true;
          copyHook(mainHooks, "error", "error");
          copyHook(mainHooks, "beforeSent", "beforeSent");
          copyHook(mainHooks, "afterSent", "afterSent");
        }
        addHook(name, hookFunction);
        return {
          hook,
          extract,
          handler,
          check,
          process
        };
      };
      const extracted = {};
      const extract = (extractObj, error) => {
        Object.entries(extractObj).forEach(([index2, value2]) => {
          extracted[index2] = value2;
        });
        return {
          check,
          handler,
          process
        };
      };
      const checkers = [];
      const process = (returnProcessExec2) => {
        checkers.push(returnProcessExec2);
        if (hasHook === false) {
          hasHook = true;
          copyHook(mainHooks, "error", "error");
          copyHook(mainHooks, "beforeSent", "beforeSent");
          copyHook(mainHooks, "afterSent", "afterSent");
        }
        if (Object.values(returnProcessExec2.hooks).flat(1).length !== 0) {
          copyHook(returnProcessExec2.hooks, "error", "error");
          copyHook(returnProcessExec2.hooks, "beforeSent", "beforeSent");
          copyHook(returnProcessExec2.hooks, "afterSent", "afterSent");
        }
        return {
          check,
          process,
          handler
        };
      };
      const check = (checker) => {
        checkers.push(checker);
        return {
          check,
          handler,
          process
        };
      };
      const handler = (handlerFunction) => {
        buildHooks();
        const ZE = ZodError;
        const mf = makeFloor;
        const lh = launchHooks;
        const RI = ResponseInstance;
        const _e_ = __exec__;
        if (!!ZE && !!mf && !!lh && !!RI && !!_e_ && false) {
          console.log();
        }
        let stringFunction = (
          /* js */
          `
					const {pickup, drop} = mf();
				`
        );
        let isAsync = false;
        if (hasHook === true)
          stringFunction += `
					try {
				`;
        if (Object.keys(extracted).length !== 0) {
          stringFunction += `
						let currentExtractedType;
						let currentExtractedIndex;
						try {
					`;
          Object.entries(extracted).forEach(([type, content]) => {
            if (content instanceof zod.ZodType) {
              stringFunction += /* js */
              `
								currentExtractedType = "${type}";
								currentExtractedIndex = "";
								drop(
									"${type}",
									extracted.${type}.parse(request.${type})
								);
							`;
            } else {
              Object.keys(content).forEach((index2) => {
                stringFunction += /* js */
                `
									currentExtractedType = "${type}";
									currentExtractedIndex = "${index2}";
									drop(
										"${index2}",
										extracted.${type}.${index2}.parse(request.${type}.${index2})
									);
								`;
              });
            }
          });
          stringFunction += /* js */
          `
						} catch(err) {
							if(err instanceof ZE)errorExtract(response, currentExtractedType, currentExtractedIndex, err);
							else throw err;
						}
					`;
        }
        if (checkers.length !== 0) {
          stringFunction += /* js */
          `
						let currentChecker;
						let result;
					`;
          checkers.forEach((value2, index2) => {
            if (typeof value2 === "function") {
              if (value2.constructor.name === "AsyncFunction") {
                stringFunction += /* js */
                `
									await checkers[${index2}]({pickup, drop}, response, () => {});
								`;
                isAsync = true;
              } else
                stringFunction += /* js */
                `
								checkers[${index2}]({pickup, drop}, response, () => {});
							`;
            } else if (value2.type === "checker") {
              value2 = value2;
              stringFunction += /* js */
              `
								currentChecker = checkers[${index2}].name;
							`;
              if (value2.handler.constructor.name === "AsyncFunction") {
                stringFunction += /* js */
                `
									result = await checkers[${index2}].handler(
										checkers[${index2}].input(pickup),
										(info, data) => ({info, data}),
										checkers[${index2}].options
									);
								`;
                isAsync = true;
              } else
                stringFunction += /* js */
                `
								result = checkers[${index2}].handler(
									checkers[${index2}].input(pickup),
									(info, data) => ({info, data}),
									checkers[${index2}].options
								);
							`;
              stringFunction += /* js */
              `
								if(!checkers[${index2}].validate(result.info, result.data))checkers[${index2}].catch(response, result.info, result.data, () => {});
							`;
              if (value2.output)
                stringFunction += /* js */
                `
								checkers[${index2}].output(drop, result.data);
							`;
            } else if (value2.type === "process") {
              value2 = value2;
              stringFunction += /* js */
              `
								currentChecker = checkers[${index2}].name;
							`;
              if (value2.processFunction.constructor.name === "AsyncFunction") {
                stringFunction += /* js */
                `
									result = await checkers[${index2}].processFunction(
										request, 
										response, 
										checkers[${index2}].options,
										${value2.input ? (
                  /* js */
                  `checkers[${index2}].input(pickup)`
                ) : ""}
									);
								`;
                isAsync = true;
              } else
                stringFunction += /* js */
                `
								result = checkers[${index2}].processFunction(
									request, 
									response, 
									checkers[${index2}].options,
									${value2.input ? (
                  /* js */
                  `checkers[${index2}].input(pickup)`
                ) : ""}
								);
							`;
              if (value2.pickup) {
                value2.pickup.forEach((index3) => {
                  stringFunction += /* js */
                  `
										drop("${index3}", result["${index3}"]);
									`;
                });
              }
            }
          });
        }
        if (handlerFunction.constructor.name === "AsyncFunction") {
          stringFunction += /* js */
          `
						await handlerFunction({pickup, drop}, response);
					`;
          isAsync = true;
        } else
          stringFunction += /* js */
          `
					handlerFunction({pickup, drop}, response);
				`;
        if (hasHook === true)
          stringFunction += /* js */
          `
					} catch(result) {
						if(result instanceof Error){
							response.code(500);
							response.data = result;
							result = response;
							await lh("error", request, response, result);
						}

						if(result?.[Symbol.hasInstance]?.(RI)){
							await lh("beforeSent", request, response);
							result[_e_]();
							await lh("afterSent", request, response);
						}
						else throw result;
					}
				`;
        routes[method][path] = eval((isAsync || hasHook ? "async" : "") + /* js */
        `(request, response) => {${stringFunction}}`);
      };
      return {
        extract,
        check,
        handler,
        hook,
        process
      };
    },
    setNotfoundHandler(notFoundFunction) {
      notfoundHandlerFunction = notFoundFunction;
    },
    buildRoute() {
      Object.entries(routes).forEach(([index, value]) => {
        let stringFunction = "let result;\n";
        Object.keys(value).forEach((path2) => {
          let regex = `/^${path2.replace(/\//g, "\\/")}$/`.replace(
            /\{([a-zA-Z0-9_\-]+)\}/g,
            (match, group1) => `(?<${group1}>[a-zA-Z0-9_-]+)`
          );
          stringFunction += /* js */
          `
						result = ${regex}.exec(path);
						if(result !== null) return {
							path: "${path2}",
							params: result.groups || {}
						};
					`;
        });
        buildedRoutes[index] = eval(
          /* js */
          `path => {${stringFunction}}`
        );
      });
    },
    findRoute(method2, path2) {
      if (!buildedRoutes[method2])
        return {
          notfoundFunction: notfoundHandlerFunction
        };
      let result = buildedRoutes[method2](path2);
      if (!result)
        return {
          notfoundFunction: notfoundHandlerFunction
        };
      else
        return {
          routeFunction: routes[method2][result.path],
          params: result.params
        };
    },
    routes,
    buildedRoutes
  };
}

function makeCheckerSystem() {
  function createChecker(name, checkerObj) {
    function checkerExec(checkerExec2) {
      return {
        name,
        handler: checkerObj.handler,
        options: checkerExec2.options || checkerObj.options || {},
        input: checkerExec2.input,
        validate: checkerExec2.validate,
        catch: checkerExec2.catch,
        output: checkerExec2.output,
        type: "checker"
      };
    }
    checkerExec.use = function(checkerExec2) {
      let result = checkerObj.handler(
        checkerExec2.input(),
        (info, data) => ({ info, data }),
        checkerExec2.options || checkerObj.options || {}
      );
      if (!checkerExec2.validate(result.info, result.data))
        checkerExec2.catch(result.info, result.data);
      checkerExec2.output?.(result.data);
    };
    checkerExec.useAsync = async function(checkerExec2) {
      let result = await checkerObj.handler(
        checkerExec2.input(),
        (info, data) => ({ info, data }),
        checkerExec2.options || checkerObj.options || {}
      );
      if (!checkerExec2.validate(result.info, result.data))
        checkerExec2.catch(result.info, result.data);
      checkerExec2.output?.(result.data);
    };
    return checkerExec;
  }
  return {
    createChecker
  };
}

async function bodyToJson(request, response) {
  if ((request.getHeader("content-type") || "").indexOf("application/json") !== -1) {
    request.body = await new Promise((resolve, reject) => {
      let stringBody = "";
      request.rawRequest.on("error", reject);
      request.rawRequest.on("data", (chunck) => stringBody += chunck);
      request.rawRequest.on("end", () => resolve(JSON.parse(stringBody)));
    });
  }
}
function objectToString(request, response) {
  if (typeof response.data === "object" && !response.getHeader("content-type")) {
    try {
      response.data = JSON.stringify(response.data);
      response.setHeader("content-type", "application/json;charset=utf-8");
    } catch {
    }
  }
}

async function bodyToText(request, response) {
  if ((request.getHeader("content-type") || "").indexOf("text/plain") !== -1) {
    request.body = await new Promise((resolve, reject) => {
      let stringBody = "";
      request.rawRequest.on("error", reject);
      request.rawRequest.on("data", (chunck) => stringBody += chunck);
      request.rawRequest.on("end", () => resolve(stringBody));
    });
  }
}
async function textContentType(request, response) {
  if (typeof response.data === "string" && !response.getHeader("content-type")) {
    response.setHeader("content-type", "text/plain;charset=utf-8");
  }
}

function ErrorToText(request, response) {
  if (response?.data instanceof Error) {
    response.data = {
      name: response.data.name,
      message: response.data.message,
      stack: response.data.stack,
      cause: response.data.cause
    };
  }
}

class ExistProcess {
}
function makeProcessSystem() {
  const extracted = {};
  function createProcess(name) {
    const { addHook, copyHook, hooks } = makeHooksSystem(["error", "beforeSent", "afterSent"]);
    const hook = (name2, hookFunction) => {
      addHook(name2, hookFunction);
      return {
        hook,
        extract,
        handler,
        check,
        build,
        process
      };
    };
    const extract = (extractObj2, error) => {
      Object.entries(extractObj2).forEach(([index, value]) => {
        extracted[index] = value;
      });
      return {
        handler,
        check,
        build,
        process
      };
    };
    const checkers = [];
    const process = (returnProcessExec) => {
      checkers.push(returnProcessExec);
      copyHook(returnProcessExec.hooks, "error", "error");
      copyHook(returnProcessExec.hooks, "beforeSent", "beforeSent");
      copyHook(returnProcessExec.hooks, "afterSent", "afterSent");
      return {
        check,
        process,
        handler,
        build
      };
    };
    const check = (checker) => {
      checkers.push(checker);
      return {
        check,
        handler,
        build,
        process
      };
    };
    let grapHandlerFunction;
    const handler = (handlerFunction) => {
      grapHandlerFunction = handlerFunction;
      return {
        build
      };
    };
    function build(processBuild) {
      const ZE = ZodError;
      const mf = makeFloor;
      const EP = ExistProcess;
      if (!!ZE && !!mf && !!EP && false) {
        console.log();
      }
      let stringFunction = (
        /* js */
        `
				const {pickup, drop} = mf();
			`
      );
      let isAsync = false;
      if (processBuild?.allowExitProcess)
        stringFunction += `
				try{
			`;
      if (processBuild?.input) {
        stringFunction += /* js */
        `
					drop("input", input);
				`;
      }
      if (processBuild?.options) {
        stringFunction += /* js */
        `
					drop("options", options);
				`;
      }
      if (Object.keys(extracted).length !== 0) {
        stringFunction += `
					let currentExtractedType;
					let currentExtractedIndex;
					try {
				`;
        Object.entries(extracted).forEach(([type, content]) => {
          if (content instanceof zod.ZodType) {
            stringFunction += /* js */
            `
							currentExtractedType = "${type}";
							currentExtractedIndex = "";
							drop(
								"${type}",
								extracted.${type}.parse(request.${type})
							);
						`;
          } else {
            Object.keys(content).forEach((index) => {
              stringFunction += /* js */
              `
								currentExtractedType = "${type}";
								currentExtractedIndex = "${index}";
								drop(
									"${index}",
									extracted.${type}.${index}.parse(request.${type}.${index})
								);
							`;
            });
          }
        });
        stringFunction += /* js */
        `
					} catch(err) {
						if(err instanceof ZE)errorExtract(response, currentExtractedType, currentExtractedIndex, err);
						else throw err;
					}
				`;
      }
      if (checkers.length !== 0) {
        stringFunction += /* js */
        `
					let currentChecker;
					let result;
				`;
        checkers.forEach((value, index) => {
          if (typeof value === "function") {
            stringFunction += /* js */
            `
							currentChecker = "anonyme";
						`;
            if (value.constructor.name === "AsyncFunction") {
              stringFunction += /* js */
              `
								await checkers[${index}]({pickup, drop}, response, () => {throw EP;});
							`;
              isAsync = true;
            } else
              stringFunction += /* js */
              `
							checkers[${index}]({pickup, drop}, response, () => {throw EP;});
						`;
          } else if (value.type === "checker") {
            value = value;
            stringFunction += /* js */
            `
							currentChecker = checkers[${index}].name;
						`;
            if (value.handler.constructor.name === "AsyncFunction") {
              stringFunction += /* js */
              `
								result = await checkers[${index}].handler(
									checkers[${index}].input(pickup),
									(info, data) => ({info, data}),
									checkers[${index}].options
								);
							`;
              isAsync = true;
            } else
              stringFunction += /* js */
              `
							result = checkers[${index}].handler(
								checkers[${index}].input(pickup),
								(info, data) => ({info, data}),
								checkers[${index}].options
							);
						`;
            stringFunction += /* js */
            `
							if(!checkers[${index}].validate(result.info, result.data))checkers[${index}].catch(response, result.info, result.data, () => {throw EP;});
						`;
            if (value.output)
              stringFunction += /* js */
              `
							checkers[${index}].output(drop, result.data);
						`;
          } else if (value.type === "process") {
            value = value;
            stringFunction += /* js */
            `
							currentChecker = checkers[${index}].name;
						`;
            if (value.processFunction.constructor.name === "AsyncFunction") {
              stringFunction += /* js */
              `
								result = await checkers[${index}].processFunction(
									request, 
									response, 
									checkers[${index}].options,
									${value.input ? (
                /* js */
                `checkers[${index}].input(pickup)`
              ) : ""}
								);
							`;
              isAsync = true;
            } else
              stringFunction += /* js */
              `
							result = checkers[${index}].processFunction(
								request, 
								response, 
								checkers[${index}].options,
								${value.input ? (
                /* js */
                `checkers[${index}].input(pickup)`
              ) : ""}
							);
						`;
            if (value.pickup) {
              value.pickup.forEach((index2) => {
                stringFunction += /* js */
                `
									drop("${index2}", result["${index2}"]);
								`;
              });
            }
          }
        });
      }
      if (grapHandlerFunction) {
        if (grapHandlerFunction.constructor.name === "AsyncFunction") {
          stringFunction += /* js */
          `
						await grapHandlerFunction({pickup, drop}, response, () => {throw EP;});
					`;
          isAsync = true;
        } else
          stringFunction += /* js */
          `
					grapHandlerFunction({pickup, drop}, response, () => {throw EP;});
				`;
      }
      if (processBuild?.allowExitProcess)
        stringFunction += /* js */
        `
				} catch(error) {
					if(error !== EP) throw error;
				}
			`;
      if (processBuild?.drop && processBuild?.drop.length !== 0) {
        stringFunction += "return {";
        processBuild.drop.forEach((index) => {
          stringFunction += /* js */
          `
						"${index}": pickup("${index}"),
					`;
        });
        stringFunction += "}";
      }
      const processFunction = eval((isAsync ? "async" : "") + /* js */
      `(request, response, input, options) => {${stringFunction}}`);
      const processExec = function(processExec2) {
        return {
          name,
          options: processExec2?.options || processBuild?.options,
          input: processExec2?.input || processBuild?.input,
          processFunction,
          pickup: processExec2?.pickup,
          hooks,
          type: "process"
        };
      };
      processExec.use = function(request, response, processExec2) {
        return processFunction(
          request,
          response,
          processExec2?.options || processBuild?.options,
          processExec2?.input?.()
        );
      };
      return processExec;
    }
    return {
      hook,
      extract,
      check,
      handler,
      process,
      build
    };
  }
  return {
    createProcess
  };
}

function parsCookies(request, response) {
  if (request.rawRequest.headers?.cookie) {
    request.cookies = cookie.parse(request.rawRequest.headers?.cookie || "");
  }
}
function serializeCookies(request, response) {
  if (response.cookies && Object.keys(response.cookies)[0] !== void 0) {
    const setCookies = [];
    Object.entries(response.cookies).forEach(([index, obj]) => setCookies.push(cookie.serialize(index, obj.value, obj.params)));
    response.rawResponse.setHeader("set-cookie", setCookies.join(", "));
  }
}

function anotherback(config) {
  config.prefix = extractPathAndQueryFromUrl(config.prefix || "").path;
  if (config.prefix === "/")
    config.prefix = "";
  const { addHook, buildHooks, launchHooks, hooks } = makeHooksSystem([
    "init",
    "serializeBody",
    "error",
    "beforeSent",
    "afterSent"
  ]);
  addHook("init", parsCookies);
  addHook("serializeBody", bodyToJson);
  addHook("serializeBody", bodyToText);
  addHook("error", ErrorToText);
  addHook("beforeSent", serializeCookies);
  addHook("beforeSent", objectToString);
  addHook("beforeSent", textContentType);
  const { createChecker } = makeCheckerSystem();
  const { declareRoute, buildRoute, findRoute, setNotfoundHandler } = makeRoutesSystem(config, hooks);
  const { createProcess } = makeProcessSystem();
  const server = http.createServer(
    async (serverRequest, serverResponse) => {
      const request = makeRequest(serverRequest);
      const response = makeResponse(serverResponse);
      try {
        try {
          const { routeFunction, params, notfoundFunction } = findRoute(request.method, request.path);
          if (notfoundFunction)
            notfoundFunction(request, response);
          else {
            request.params = params;
            await launchHooks("init", request, response);
            if (["POST", "PUT", "PATCH"].includes(request.method)) {
              await launchHooks("serializeBody", request, response);
            }
            await routeFunction(request, response);
            if (response.isSend === false)
              response.code(503).info("NO_SEND_RESPONSE").send();
          }
        } catch (result) {
          if (result instanceof Error) {
            response.code(500);
            response.data = result;
            result = response;
            await launchHooks("error", request, response, result);
          }
          if (result?.[Symbol.hasInstance]?.(ResponseInstance)) {
            await launchHooks("beforeSent", request, response);
            result[__exec__]();
            await launchHooks("afterSent", request, response);
          } else
            throw result;
        }
      } catch (error) {
        console.error(error);
        serverResponse.writeHead(500, { "content-type": "text/plain;charset=utf-8" });
        if (error instanceof Error)
          serverResponse.write(error.stack);
        else
          serverResponse.write("SEE SERVER CONSOLE");
        serverResponse.end();
      }
    }
  );
  return {
    server,
    config,
    launch() {
      buildHooks();
      buildRoute();
      return server.listen(
        config.port,
        config.host,
        0,
        config.callback || (() => console.log("Ready !"))
      );
    },
    addHook,
    input(inputFunction, options) {
      return inputFunction(addHook, options);
    },
    declareRoute,
    createChecker,
    setNotfoundHandler,
    createProcess
  };
}

var Token;
((Token2) => {
  function create(name, objCreateToken) {
    return {
      generate(content) {
        objCreateToken.content.parse(content);
        return jwt.sign({ content }, objCreateToken.key, objCreateToken.options?.generate);
      },
      verify(token) {
        try {
          const result = jwt.verify(token, objCreateToken.key, objCreateToken.options?.verify);
          if (typeof result !== "object" || result.content === void 0)
            return false;
          return result.content;
        } catch {
          return false;
        }
      },
      read(token) {
        try {
          const result = jwt.decode(token, objCreateToken.options?.read);
          if (typeof result !== "object" || result.content === void 0)
            return false;
          return result.content;
        } catch {
          return false;
        }
      },
      refresh(token) {
        const result = this.read(token);
        if (result === false)
          return false;
        return this.generate(result);
      }
    };
  }
  Token2.create = create;
})(Token || (Token = {}));
var Token$1 = Token;

export { Token$1 as Token, anotherback as default };
