import { AlchemyReproApi } from "@repo/api/stack";
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

export default Alchemy.Stack(
	"AlchemyReproWeb",
	{
		providers: Cloudflare.providers(),
		state: Cloudflare.state(),
	},
	Effect.gen(function* () {
		const api = yield* AlchemyReproApi;

		const website = yield* Cloudflare.Vite("Website", {
			env: {
				VITE_API_URL: api.url,
			},
		});

		return {
			url: website.url.as<string>(),
		};
	}),
);
