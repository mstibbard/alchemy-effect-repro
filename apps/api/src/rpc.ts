import { TaskRpc } from "@repo/api-contracts/rpc";
import * as Effect from "effect/Effect";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";

import { TaskOperations } from "./tasks/task-operations.ts";
export { TaskRpc, type TaskRpcs } from "@repo/api-contracts/rpc";

export const TaskRpcLive = TaskRpc.toLayer(
	Effect.gen(function* () {
		const tasks = yield* TaskOperations;
		return {
			listTasks: () => tasks.list,
			getTask: tasks.get,
			createTask: tasks.create,
		};
	}),
);

export const makeTaskRpcHttpEffect = () =>
	RpcServer.toHttpEffect(TaskRpc).pipe(
		Effect.provide(TaskRpcLive),
		Effect.provide(RpcSerialization.layerJson),
	);
