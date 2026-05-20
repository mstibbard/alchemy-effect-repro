import type { KVNamespaceClient } from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
export { CreateTaskFailed, ListTasksFailed, Task, TaskNotFound } from "./domain/task.ts";
import { CreateTaskFailed, ListTasksFailed, Task, TaskNotFound } from "./domain/task.ts";

export const listTasks = (tasks: KVNamespaceClient<string>) =>
	Effect.gen(function* () {
		const listed = yield* tasks
			.list()
			.pipe(Effect.mapError((cause) => new ListTasksFailed({ message: cause.message })));
		const keys: Array<string> = listed.keys.map((key: { name: string }) => key.name);

		if (keys.length === 0) {
			return [];
		}

		const values = yield* tasks
			.get<Task>(keys, "json")
			.pipe(Effect.mapError((cause) => new ListTasksFailed({ message: cause.message })));
		return Array.from(values.values(), (task) => (task ? new Task(task) : undefined)).filter(
			(task): task is Task => task !== undefined,
		);
	});

export const getTask =
	(tasks: KVNamespaceClient<string>) =>
	({ id }: { id: string }) =>
		Effect.gen(function* () {
			const task = yield* tasks.get<Task>(id, "json").pipe(Effect.mapError(() => new TaskNotFound({ id })));
			if (!task) {
				return yield* Effect.fail(new TaskNotFound({ id }));
			}
			return new Task(task);
		});

export const createTask =
	(tasks: KVNamespaceClient<string>) =>
	({ title }: { title: string }) =>
		Effect.gen(function* () {
			const task = new Task({
				id: crypto.randomUUID(),
				title,
				completed: false,
			});
			yield* tasks
				.put(task.id, JSON.stringify(task))
				.pipe(Effect.mapError((cause) => new CreateTaskFailed({ message: cause.message })));
			return task;
		});
