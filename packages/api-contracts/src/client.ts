import type { Task, TaskNotFound, TaskUnavailable } from "@repo/domain/task";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";
import type { RpcClientError } from "effect/unstable/rpc/RpcClientError";

import { TaskRpc } from "./rpc.ts";

const rpcUrl = (baseUrl: string) => new URL("/rpc", baseUrl).toString();

export interface ClientService {
	readonly listTasks: (input: void) => Effect.Effect<ReadonlyArray<Task>, TaskUnavailable | RpcClientError>;
	readonly createTask: (input: { readonly title: string }) => Effect.Effect<Task, TaskUnavailable | RpcClientError>;
	readonly getTask: (input: {
		readonly id: string;
	}) => Effect.Effect<Task, TaskNotFound | TaskUnavailable | RpcClientError>;
}

export class Client extends Context.Service<Client, ClientService>()("Client") {}

export const makeClient = (baseUrl: string) =>
	RpcClient.make(TaskRpc).pipe(
		Effect.provide(
			RpcClient.layerProtocolHttp({
				url: rpcUrl(baseUrl),
			}).pipe(Layer.provide(RpcSerialization.layerJson)),
		),
	);

export const makeClientLive = (baseUrl: string) =>
	Layer.effect(Client)(makeClient(baseUrl)).pipe(Layer.provide(FetchHttpClient.layer));
