import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Etag from "effect/unstable/http/Etag";
import * as HttpPlatform from "effect/unstable/http/HttpPlatform";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";
import type { FromClientEncoded, FromServerEncoded } from "effect/unstable/rpc/RpcMessage";

import { TaskApiLive } from "../http.ts";
import { makeNativeRpcHandler } from "../native-rpc.ts";
import { TaskRpc, TaskRpcLive, type TaskRpcRpcs } from "../rpc.ts";
import { ExampleSecret } from "./secret.ts";

const AppLive = Layer.mergeAll(
	TaskApiLive,

	RpcServer.layerHttp({
		group: TaskRpc,
		path: "/rpc",
		protocol: "http",
	}),
).pipe(Layer.provide(TaskRpcLive), Layer.provide(RpcSerialization.layerJson));

export interface WorkerShape {
	effectRpc: (request: FromClientEncoded) => Effect.Effect<ReadonlyArray<FromServerEncoded>>;
}

export class Worker extends Cloudflare.Worker<Worker, WorkerShape>()("Worker", { main: import.meta.path }) {}

export default Worker.make(
	Effect.gen(function* () {
		yield* Cloudflare.Secret.bind(ExampleSecret);
		const fetch = yield* HttpRouter.toHttpEffect(AppLive).pipe(
			Effect.provide(Layer.mergeAll(HttpPlatform.layer, Etag.layer)),
		);

		const effectRpc = makeNativeRpcHandler<TaskRpcRpcs>(TaskRpc);

		return Worker.of({
			fetch,
			effectRpc: (request) => effectRpc(request).pipe(Effect.provide(TaskRpcLive), Effect.scoped),
		});
	}).pipe(Effect.provide(Cloudflare.SecretBindingLive)),
);
