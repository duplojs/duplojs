import {Worker} from "worker_threads";
import {ZodError, ZodType} from "zod";
import chalk from "chalk";

export type testing = {
	title: string,
	url: string,
	method: string,
	output?: string[],
	query?: Record<string, boolean | string | number | undefined>,
	params?: Record<string, boolean | string | number | undefined>,
	body?: Record<string, any> | string,
	headers?: Record<string, boolean | string | number | undefined>,
	response?: {
		code?: number,
		info?: string,
		headers?: Record<string, string>,
		body?: ZodType,
	},
}

export async function test(file: string, testing: testing[]){
	const thread = new Worker(
		file, 
		{
			execArgv: ["--require", "ts-node/register"]
		}
	);
	
	await new Promise(resolve => thread.once("message", message => message !== "ready" || resolve(undefined)));

	let messages: string[] = [];
	thread.on("message", msg => messages.push(msg));

	let numberError = 0;

	for(const test of testing){
		messages = [];
		const query = Object.entries(test.query || {})
		.reduce(
			(p, [key, value]) => {
				if(value) p.push(`${key}=${value.toString()}`);
				return p;
			}, 
			[] as string[]
		)
		.join("&");

		const url = Object.entries(test.params || {}).reduce(
			(p, [key, value]) =>  value ? p.replace(`{${key}}`, value.toString()) : p,
			test.url + (query ? `?${query}` : "")
		);

		const headers = Object.entries(test.headers || {}).reduce(
			(p, [key, value]) => {
				if(typeof value !== "undefined") p[key] = value.toString();
				return p;
			}, 
			{} as Record<string, string>
		);
		
		console.log(chalk.bold(test.title));
		console.log(chalk.underline("URL"), ":", url);
		console.log(chalk.underline("METHOD"), ":", test.method);
		
		const response = await fetch(
			url,
			{
				method: test.method,
				headers: headers,
				body: test.body ? JSON.stringify(test.body) : undefined,
			}
		);

		const responseContentType = response.headers.get("content-type") || "";

		let result: any;
		if(responseContentType.indexOf("application/json") !== -1) result = await response.json();
		else if(responseContentType.indexOf("text/") !== -1) result = await response.text();
		else result = await response.blob();

		if(test.response?.code){
			if(test.response.code !== response.status){
				console.error(chalk.redBright("Error"), "status :", test.response.code, "!=", response.status);
				numberError++;
			}
			else console.log(chalk.greenBright("Valide"), "status :", response.status);
		}

		if(test.response?.info){
			if(test.response.info !== response.headers.get("info")){
				console.error(chalk.redBright("Error"), "info :", test.response.info, "!=", response.headers.get("info"));
				numberError++;
			}
			else console.log(chalk.greenBright("Valide"), "info :", response.headers.get("info"));
		}
		
		Object.entries(test.response?.headers || {}).forEach(([key, value]) => {
			if(response.headers.get(key) !== value){
				console.error(chalk.redBright("Error"), "Header :", value, "!=", response.headers.get(key));
				numberError++;
			}
			else console.log(chalk.greenBright("Valide"), "Header :", response.headers.get(key));
		});
		
		if(test.response?.body){
			try {
				test.response.body.parse(result);
				console.log(chalk.greenBright("Valide"), "Body");
			}
			catch (error){
				if(error instanceof ZodError){
					console.error(chalk.redBright("Error"), "body :", error.message, JSON.stringify(result, null, 2));
					numberError++;
				}
				else throw error;
			}
		}

		if(test.output){
			for(let index = 0; index < test.output.length || index < messages.length; index++){
				if(test.output[index] !== messages[index]){
					console.error(chalk.redBright("Error"), "log :", test.output[index], "!=", messages[index]);
					numberError++;
				}
				else console.log(chalk.greenBright("Valide"), "log :", test.output[index]);
			}
		}

		console.log("");
	}

	if(numberError !== 0)console.error(numberError, chalk.redBright.underline.bold("Errors"));
	else console.error(chalk.greenBright.underline.bold("All Is Valide"));

	await thread.terminate();

	return numberError;
}
