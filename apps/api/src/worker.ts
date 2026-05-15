import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Etag from "effect/unstable/http/Etag";
import * as HttpPlatform from "effect/unstable/http/HttpPlatform";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";

import { TaskApiLive } from "./http.ts";
import { TaskRpc, TaskRpcLive } from "./rpc.ts";
import { ExampleSecret } from "./secret.ts";

const AppLive = Layer.mergeAll(
	TaskApiLive,

	RpcServer.layerHttp({
		group: TaskRpc,
		path: "/rpc",
		protocol: "http",
	}),
).pipe(Layer.provide(TaskRpcLive), Layer.provide(RpcSerialization.layerJson));

export const Worker = Cloudflare.Worker(
	"Worker",
	{ main: import.meta.path },
	Effect.gen(function* () {
		const _secret = yield* Cloudflare.Secret.bind(ExampleSecret);

		return yield* HttpRouter.toHttpEffect(AppLive).pipe(
			Effect.map((fetch) => ({ fetch })),
			Effect.provide(Layer.mergeAll(HttpPlatform.layer, Etag.layer)),
		);
	}).pipe(Effect.provide(Cloudflare.SecretBindingLive)),
);

export default Worker;
