import { Worker as ApiWorker } from "@repo/api/worker";
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

const Website = Cloudflare.Vite("AlchemyReproWebsite", {
	bindings: {
		API: ApiWorker,
	},
	compatibility: {
		flags: ["nodejs_compat"],
	},
});

export type WebsiteEnv = Cloudflare.InferEnv<typeof Website>;

export default Alchemy.Stack(
	"AlchemyReproWebsite",
	{
		providers: Cloudflare.providers(),
		state: Cloudflare.state(),
	},
	Effect.gen(function* () {
		const app = yield* Website;

		return {
			url: app.url,
		};
	}),
);
