import type { KVNamespaceClient } from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Etag from "effect/unstable/http/Etag";
import * as HttpPlatform from "effect/unstable/http/HttpPlatform";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";

import { TaskApiLive } from "./http.ts";
import { TaskRpc, TaskRpcLive } from "./rpc.ts";
import { IdGeneratorLive } from "./services/id-generator.ts";
import { makeKvTaskRepositoryLive } from "./services/task-repository-kv.ts";

const corsHeaders = {
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "GET, POST, OPTIONS",
	"access-control-allow-headers": "b3, content-type, traceparent, tracestate",
};

export const makeAppLive = (tasks: KVNamespaceClient<string>) =>
	Layer.mergeAll(
		TaskApiLive,
		RpcServer.layerHttp({
			group: TaskRpc,
			path: "/rpc",
			protocol: "http",
		}),
		HttpRouter.cors({
			allowedMethods: ["GET", "POST", "OPTIONS"],
			allowedHeaders: ["b3", "content-type", "traceparent", "tracestate"],
		}),
	).pipe(
		Layer.provide(TaskRpcLive),
		Layer.provide(makeKvTaskRepositoryLive(tasks)),
		Layer.provide(IdGeneratorLive),
		Layer.provide(RpcSerialization.layerJson),
	);

export const makeWorkerFetch = (tasks: KVNamespaceClient<string>) =>
	HttpRouter.toHttpEffect(makeAppLive(tasks)).pipe(
		Effect.map((handleRequest) => handleRequest.pipe(Effect.map(HttpServerResponse.setHeaders(corsHeaders)))),
		Effect.provide(Layer.mergeAll(HttpPlatform.layer, Etag.layer)),
	);
