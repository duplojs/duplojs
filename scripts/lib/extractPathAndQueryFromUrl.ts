export default function extractPathAndQueryFromUrl(url?: string): {path: string, query?: Record<string, string>}
{
	if(!url) return {path: "/"};
	if(url[0] !== "/") url = "/" + url;
	let [path, query] = url.split("?");
	path = path.endsWith("/") && path.length !== 1 ? path.slice(0, -1) : path;
	if(query){
		const queryObj: Record<string, string> = {};
		new URLSearchParams(query).forEach((value, key) => queryObj[key] = value);

		return {
			path,
			query: queryObj
		};
	}
	else return {path};
}
