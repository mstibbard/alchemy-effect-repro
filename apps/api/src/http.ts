import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import * as HttpApi from "effect/unstable/httpapi/HttpApi";
import * as HttpApiBuilder from "effect/unstable/httpapi/HttpApiBuilder";
import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";
import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";

import { Task } from "./task.ts";

const getTask = HttpApiEndpoint.get("getTask", "/:id", {
	params: {
		id: Schema.String,
	},
	success: Task,
});

const createTask = HttpApiEndpoint.post("createTask", "/", {
	success: Task,
	payload: Schema.Struct({
		title: Schema.String,
	}),
});

export const TaskApi = HttpApi.make("TaskApi").add(HttpApiGroup.make("Tasks").add(getTask, createTask));

const tasks = new Map<string, Task>();

export const TaskApiLive = HttpApiBuilder.layer(TaskApi).pipe(
	Layer.provide(
		HttpApiBuilder.group(TaskApi, "Tasks", (handlers) =>
			Effect.gen(function* () {
				return handlers
					.handle(
						"getTask",
						Effect.fn(function* (req) {
							const task = tasks.get(req.params.id);
							if (!task) {
								return HttpServerResponse.text("Not found", { status: 404 });
							}
							return task;
						}),
					)
					.handle(
						"createTask",
						Effect.fn(function* (req) {
							const task = new Task({
								id: crypto.randomUUID(),
								title: req.payload.title,
								completed: false,
							});
							tasks.set(task.id, task);
							return task;
						}),
					);
			}),
		),
	),
);
