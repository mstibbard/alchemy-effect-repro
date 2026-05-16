import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Etag from "effect/unstable/http/Etag";
import * as HttpPlatform from "effect/unstable/http/HttpPlatform";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";

import { TaskApiLive } from "../http.ts";
import { TaskRpc, TaskRpcLive } from "../rpc.ts";
import { ExampleSecret } from "./secret.ts";

const AppLive = Layer.mergeAll(
	TaskApiLive,

	RpcServer.layerHttp({
		group: TaskRpc,
		path: "/rpc",
		protocol: "http",
	}),
).pipe(Layer.provide(TaskRpcLive), Layer.provide(RpcSerialization.layerJson));

export class Worker extends Cloudflare.Worker<Worker, {}>()("Worker", { main: import.meta.path }) {}

export default Worker.make(
	Effect.gen(function* () {
		yield* Cloudflare.Secret.bind(ExampleSecret);
		const fetch = yield* HttpRouter.toHttpEffect(AppLive).pipe(
			Effect.provide(Layer.mergeAll(HttpPlatform.layer, Etag.layer)),
		);

		return Worker.of({ fetch });
	}).pipe(Effect.provide(Cloudflare.SecretBindingLive)),
);
