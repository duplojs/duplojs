export class UncaughtResponse extends Error{
	constructor(message = "Une réponse a interrompu le code dans un bloc non syncronisé."){
		super(message);
	}
}
