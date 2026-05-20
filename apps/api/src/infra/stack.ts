import * as Alchemy from "alchemy";

export class AlchemyReproApi extends Alchemy.Stack<
	AlchemyReproApi,
	{
		url: string;
	}
>()("AlchemyReproApi") {}
