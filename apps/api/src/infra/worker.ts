import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Etag from "effect/unstable/http/Etag";
import * as HttpPlatform from "effect/unstable/http/HttpPlatform";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";

import { makeTaskApiLive } from "../http.ts";
import { makeTaskRpcLive, TaskRpc } from "../rpc.ts";
import { ApiKv } from "./kv.ts";
import { ExampleSecret } from "./secret.ts";

const corsHeaders = {
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "GET, POST, OPTIONS",
	"access-control-allow-headers": "b3, content-type, traceparent, tracestate",
};

const makeAppLive = (tasks: Cloudflare.KVNamespaceClient<string>) =>
	Layer.mergeAll(
		makeTaskApiLive(tasks),

		RpcServer.layerHttp({
			group: TaskRpc,
			path: "/rpc",
			protocol: "http",
		}),
		HttpRouter.cors({
			allowedMethods: ["GET", "POST", "OPTIONS"],
			allowedHeaders: ["b3", "content-type", "traceparent", "tracestate"],
		}),
	).pipe(Layer.provide(makeTaskRpcLive(tasks)), Layer.provide(RpcSerialization.layerJson));

export class Worker extends Cloudflare.Worker<Worker, {}>()("Worker", { main: import.meta.path }) {}

export default Worker.make(
	Effect.gen(function* () {
		yield* Cloudflare.Secret.bind(ExampleSecret);
		const tasks = yield* Cloudflare.KVNamespace.bind(ApiKv);
		const fetch = HttpRouter.toHttpEffect(makeAppLive(tasks)).pipe(
			Effect.map((handleRequest) => handleRequest.pipe(Effect.map(HttpServerResponse.setHeaders(corsHeaders)))),
			Effect.provide(Layer.mergeAll(HttpPlatform.layer, Etag.layer)),
		);

		return Worker.of({ fetch });
	}).pipe(Effect.provide(Layer.mergeAll(Cloudflare.SecretBindingLive, Cloudflare.KVNamespaceBindingLive))),
);
