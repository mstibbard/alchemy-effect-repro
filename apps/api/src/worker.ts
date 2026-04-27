import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Etag from "effect/unstable/http/Etag";
import * as HttpPlatform from "effect/unstable/http/HttpPlatform";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";

import { TaskApiLive } from "./http.ts";
import { TaskRpc, TaskRpcLive } from "./rpc.ts";

const AppLive = Layer.mergeAll(
	TaskApiLive,

	RpcServer.layerHttp({
		group: TaskRpc,
		path: "/rpc",
		protocol: "http",
	}),
).pipe(Layer.provide(TaskRpcLive), Layer.provide(RpcSerialization.layerJson));

export default Cloudflare.Worker(
	"Worker",
	{ main: import.meta.path },
	HttpRouter.toHttpEffect(AppLive).pipe(
		Effect.map((fetch) => ({ fetch })),
		Effect.provide(Layer.mergeAll(HttpPlatform.layer, Etag.layer)),
	),
);
