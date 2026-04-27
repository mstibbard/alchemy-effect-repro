import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { Rpc, RpcGroup, RpcSerialization, RpcServer } from "effect/unstable/rpc";

import { Task, TaskNotFound, CreateTaskFailed } from "./task.ts";

const getTask = Rpc.make("getTask", {
	success: Task,
	error: TaskNotFound,
	payload: {
		id: Schema.String,
	},
});

const createTask = Rpc.make("createTask", {
	success: Task,
	error: CreateTaskFailed,
	payload: {
		title: Schema.String,
	},
});

export class TaskRpc extends RpcGroup.make(getTask, createTask) {}

const tasks = new Map<string, Task>();

export const TaskRpcLive = TaskRpc.toLayer(
	Effect.gen(function* () {
		return {
			getTask: ({ id }) => {
				const task = tasks.get(id);
				if (!task) {
					return Effect.fail(new TaskNotFound({ id }));
				}
				return Effect.succeed(task);
			},
			createTask: ({ title }) =>
				Effect.gen(function* () {
					const task = new Task({
						id: crypto.randomUUID(),
						title,
						completed: false,
					});
					tasks.set(task.id, task);
					return task;
				}),
		};
	}),
);

export const TaskRpcHttpEffect = RpcServer.toHttpEffect(TaskRpc).pipe(
	Effect.provide(TaskRpcLive),
	Effect.provide(RpcSerialization.layerJson),
);
