import { Random } from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";

export const Store = Cloudflare.SecretsStore("SecretStore");

export const ExampleSecret = Effect.gen(function* () {
	const store = yield* Store;
	const random = yield* Random("ReproSecretNumberValue");

	return yield* Cloudflare.Secret("REPRO_SECRET_NUMBER", {
		store,
		value: random.text,
	});
});
