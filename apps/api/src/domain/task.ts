import * as Schema from "effect/Schema";

export class Task extends Schema.Class<Task>("Task")({
	id: Schema.String,
	title: Schema.String,
	completed: Schema.Boolean,
}) {}

export class TaskNotFound extends Schema.TaggedClass<TaskNotFound>()("TaskNotFound", { id: Schema.String }) {}

export class CreateTaskFailed extends Schema.TaggedClass<CreateTaskFailed>()("CreateTaskFailed", {
	message: Schema.String,
}) {}

export class ListTasksFailed extends Schema.TaggedClass<ListTasksFailed>()("ListTasksFailed", {
	message: Schema.String,
}) {}
