import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";

import { TaskRpc } from "./rpc.ts";

const rpcUrl = (baseUrl: string) => new URL("/rpc", baseUrl).toString();

export const Client = (baseUrl: string) =>
	RpcClient.make(TaskRpc).pipe(
		Effect.provide(
			RpcClient.layerProtocolHttp({
				url: rpcUrl(baseUrl),
			}).pipe(Layer.provide(RpcSerialization.layerJson)),
		),
	);
