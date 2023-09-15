import {rejects} from "assert";
import {Request} from "./request";

type parseFunction = (request: Request) => void | Promise<void>;

type contentTypeParsers = {
	patterne: string | RegExp,
	parseFunction: parseFunction,
}

export default function makeContentTypeParserSystem(){
	const contentTypeParsers: contentTypeParsers[] = [];
	let buildedparseContentTypeBody: parseFunction = (request) => {};

	function addContentTypeParsers(patterne: string | RegExp, parseFunction: parseFunction){
		contentTypeParsers.push({
			patterne,
			parseFunction
		});
	}

	return {
		addContentTypeParsers,
		buildContentTypeBody(){
			addContentTypeParsers(
				/application\/json/, 
				(request) => new Promise(
					(resolve, reject) => {
						let stringBody = "";
						request.rawRequest.on("error", reject);
						request.rawRequest.on("data", chunck => stringBody += chunck);
						request.rawRequest.on("end", () => {
							request.body = JSON.parse(stringBody);
							resolve();
						});
					}
				)
			);
			addContentTypeParsers(
				/text\/plain/, 
				(request) => new Promise(
					(resolve, reject) => {
						let stringBody = "";
						request.rawRequest.on("error", reject);
						request.rawRequest.on("data", chunck => stringBody += chunck);
						request.rawRequest.on("end", () => {
							request.body = stringBody;
							resolve();
						});
					}
				)
			);

			let stringFunction = /* js */`
				const contentType = request.headers["content-type"];
				if(!contentType) return;
			`;
			contentTypeParsers.forEach((value, index) => {
				if(typeof value.patterne === "string"){
					stringFunction += /* js */`
						if(contentType === "${value.patterne}")return this.contentTypeParsers[${index}].parseFunction(request);
					`;
				}
				else {
					stringFunction += /* js */`
						if(${value.patterne.toString()}.test(contentType))return this.contentTypeParsers[${index}].parseFunction(request);
					`;
				}
			});

			buildedparseContentTypeBody = eval(/* js */`(function(request){${stringFunction}})`).bind({contentTypeParsers});
		},
		parseContentTypeBody: (request: Request) => buildedparseContentTypeBody(request),
		contentTypeParsers,
	};
}
