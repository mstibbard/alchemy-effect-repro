import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { makeWorkerFetch } from "../app.ts";
import { ApiKv } from "./kv.ts";
import { ExampleSecret } from "./secret.ts";

export class Worker extends Cloudflare.Worker<Worker, {}>()("Worker", { main: import.meta.path }) {}

export default Worker.make(
	Effect.gen(function* () {
		yield* Cloudflare.Secret.bind(ExampleSecret);
		const tasks = yield* Cloudflare.KVNamespace.bind(ApiKv);
		const fetch = makeWorkerFetch(tasks);
		return Worker.of({ fetch });
	}).pipe(Effect.provide(Layer.mergeAll(Cloudflare.SecretBindingLive, Cloudflare.KVNamespaceBindingLive))),
);
