export default function correctPath(path: string){
	if(path[0] !== "/") path = "/" + path;
	path = path.endsWith("/") ? path.slice(0, -1) : path;
	return path;
}
