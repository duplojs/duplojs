import {makeMokedResponse, trySend} from "../mocks/response";

let existsSyncReturn = true;

describe("request", () => {

	afterEach(() => {
		vi.mock("fs", () => ({
			existsSync: () => existsSyncReturn
		}));

		vi.mock("path", () => ({
			basename: () => "testname"
		}));
	});

	it("construct", () => {
		const {response, rawResponse} = makeMokedResponse();

		expect(response.rawResponse).toBe(rawResponse);
	});

	it("build response", () => {
		const {response} = makeMokedResponse();
		
		response
		.code(400)
		.info("test")
		.setHeader("My-Header-1", "value1")
		.setHeaders({
			"My-Header-2": "value2",
			"My-Header-3": "value3",
		})
		.info("test1");
		
		expect(response.status).toBe(400);
		expect(response.information).toBe("test1");
		expect(response.headers).toEqual({
			"My-Header-1": "value1",
			"My-Header-2": "value2",
			"My-Header-3": "value3",
			"info": "test1",
		});
	});

	it("send data", () => {
		const {response} = makeMokedResponse();
		
		trySend(() => response.send("test"));

		expect(response.isSend).toBe(true);
		expect(response.body).toBe("test");
	});

	it("send exist file", () => {
		const {response} = makeMokedResponse();
		
		trySend(() => response.code(200).sendFile("index.html"));

		expect(response.status).toBe(200);
		expect(response.isSend).toBe(true);
		expect(response.file).toBe("index.html");
		expect(response.headers).toEqual({
			"content-type": "text/html"
		});
	});

	it("send exist file with unknown mimeType", () => {
		const {response} = makeMokedResponse();
		
		trySend(() => response.sendFile("index"));

		expect(response.headers).toEqual({
			"content-type": "text/plain; charset=utf-8"
		});
	});

	it("send not found file", () => {
		existsSyncReturn = false;
		const {response} = makeMokedResponse();
		
		trySend(() => response.sendFile("index"));
		
		expect(response.status).toBe(404);
		expect(response.isSend).toBe(true);
		expect(response.file).toBe(undefined);
		expect(response.information).toBe("FILE.NOTFOUND");
	});

	it("download exist file", () => {
		existsSyncReturn = true;
		const {response} = makeMokedResponse();
		
		trySend(() => response.code(200).download("index.html"));

		expect(response.status).toBe(200);
		expect(response.isSend).toBe(true);
		expect(response.file).toBe("index.html");
		expect(response.headers).toEqual({
			"content-type": "application/octet-stream",
			"Content-Disposition": "attachment; filename=testname",
		});
	});

	it("download exist file with custom name", () => {
		const {response} = makeMokedResponse();
		
		trySend(() => response.download("index.html", "customName"));

		expect(response.headers).toEqual({
			"content-type": "application/octet-stream",
			"Content-Disposition": "attachment; filename=customName",
		});
	});

	it("download not found file", () => {
		existsSyncReturn = false;
		const {response} = makeMokedResponse();
		
		trySend(() => response.download("index"));
		
		expect(response.status).toBe(404);
		expect(response.isSend).toBe(true);
		expect(response.file).toBe(undefined);
		expect(response.information).toBe("FILE.NOTFOUND");
	});

	it("redirect", () => {
		const {response} = makeMokedResponse();
		
		trySend(() => response.redirect("/test"));

		expect(response.status).toBe(302);
		expect(response.headers).toEqual({
			"Location": "/test",
		});
	});

	it("redirect with custom code", () => {
		const {response} = makeMokedResponse();
		
		trySend(() => response.redirect("/test", 309));

		expect(response.status).toBe(309);
		expect(response.headers).toEqual({
			"Location": "/test",
		});
	});
});
