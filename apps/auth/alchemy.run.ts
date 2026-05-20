import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

import { AlchemyReproAuth } from "./src/infra/stack.ts";
import AuthWorkerLive, { AuthWorker } from "./src/infra/worker.ts";

export default AlchemyReproAuth.make(
	{
		providers: Cloudflare.providers(),
		state: Cloudflare.state(),
	},
	Effect.gen(function* () {
		const worker = yield* AuthWorker;

		return {
			url: worker.url,
		};
	}).pipe(Effect.provide(AuthWorkerLive)),
);
