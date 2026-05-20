import { Task, TaskNotFound, TaskUnavailable } from "@repo/domain/task";
import * as Schema from "effect/Schema";

const taskIdInput = {
	id: Schema.String,
};

const createTaskInput = {
	title: Schema.String,
};

export const TaskOperationContract = {
	list: {
		name: "listTasks",
		success: Schema.Array(Task),
		error: TaskUnavailable,
	},
	get: {
		name: "getTask",
		input: taskIdInput,
		success: Task,
		error: Schema.Union([TaskNotFound, TaskUnavailable]),
	},
	create: {
		name: "createTask",
		input: createTaskInput,
		payload: Schema.Struct(createTaskInput),
		success: Task,
		error: TaskUnavailable,
	},
} as const;
