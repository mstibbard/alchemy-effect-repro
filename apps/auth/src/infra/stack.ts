import * as Alchemy from "alchemy";

export class AlchemyReproAuth extends Alchemy.Stack<
	AlchemyReproAuth,
	{
		url: string;
	}
>()("AlchemyReproAuth") {}
