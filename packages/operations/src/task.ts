import {
	Task,
	TaskUnavailable,
	type TaskDecodeFailed,
	type TaskNotFound,
	type TaskStorageFailed,
} from "@repo/domain/task";
import * as Effect from "effect/Effect";

export interface CreateTaskInput {
	readonly title: string;
}

export interface IdGenerator {
	readonly nextUuid: Effect.Effect<string>;
}

export interface TaskStore<R = never> {
	readonly list: Effect.Effect<Array<Task>, TaskStorageFailed | TaskDecodeFailed, R>;
	readonly get: (input: {
		readonly id: string;
	}) => Effect.Effect<Task, TaskNotFound | TaskStorageFailed | TaskDecodeFailed, R>;
	readonly save: (task: Task) => Effect.Effect<Task, TaskStorageFailed, R>;
}

export interface TaskOperations<R = never> {
	readonly list: Effect.Effect<Array<Task>, TaskUnavailable, R>;
	readonly get: (input: { readonly id: string }) => Effect.Effect<Task, TaskNotFound | TaskUnavailable, R>;
	readonly create: (input: CreateTaskInput) => Effect.Effect<Task, TaskUnavailable, R>;
}

const unavailable = (error: TaskStorageFailed | TaskDecodeFailed) =>
	new TaskUnavailable({
		message: "Task persistence is unavailable",
		cause: error._tag === "TaskDecodeFailed" ? ("corrupt" as const) : ("storage" as const),
	});

const unavailableUnlessNotFound = (error: TaskNotFound | TaskStorageFailed | TaskDecodeFailed) =>
	error._tag === "TaskNotFound" ? error : unavailable(error);

export const makeTaskOperations = <R>(tasks: TaskStore<R>, ids: IdGenerator): TaskOperations<R> => ({
	list: tasks.list.pipe(Effect.mapError(unavailable)),
	get: (input) => tasks.get(input).pipe(Effect.mapError(unavailableUnlessNotFound)),
	create: ({ title }) =>
		ids.nextUuid.pipe(
			Effect.map(
				(id) =>
					new Task({
						id,
						title,
						completed: false,
					}),
			),
			Effect.flatMap(tasks.save),
			Effect.mapError(unavailable),
		),
});
