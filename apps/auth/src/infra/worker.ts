import * as Cloudflare from "alchemy/Cloudflare";
import * as Redacted from "effect/Redacted";
import * as Effect from "effect/Effect";

import { BetterAuth, CloudflareD1 } from "../auth/index.ts";

const deploySecret = globalThis.process?.env?.BETTER_AUTH_SECRET;

export class AuthWorker extends Cloudflare.Worker<AuthWorker, {}>()("AuthWorker", {
	main: import.meta.path,
	env: {
		BETTER_AUTH_SECRET: Redacted.make(deploySecret ?? ""),
	},
}) {}

export default AuthWorker.make(
	Effect.gen(function* () {
		if (!deploySecret) {
			return yield* Effect.die(new Error("BETTER_AUTH_SECRET must be set to deploy the auth Worker"));
		}
		const auth = yield* BetterAuth;
		return AuthWorker.of({ fetch: auth.fetch });
	}).pipe(Effect.provide(CloudflareD1)),
);
