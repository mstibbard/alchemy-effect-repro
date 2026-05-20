import { TaskNotFound } from "@repo/domain/task";
import * as Schema from "effect/Schema";
import * as HttpApi from "effect/unstable/httpapi/HttpApi";
import * as HttpApiEndpoint from "effect/unstable/httpapi/HttpApiEndpoint";
import * as HttpApiGroup from "effect/unstable/httpapi/HttpApiGroup";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";

import { TaskOperationContract } from "./task-operation-contract.ts";

export class PublicTaskUnavailable extends Schema.TaggedClass<PublicTaskUnavailable>()("TaskUnavailable", {
	message: Schema.String,
}) {}

const taskNotFoundHttp = TaskNotFound.pipe(HttpApiSchema.status("NotFound"));
const taskUnavailableHttp = PublicTaskUnavailable.pipe(HttpApiSchema.status("InternalServerError"));

const getTaskHttp = HttpApiEndpoint.get(TaskOperationContract.get.name, "/:id", {
	params: TaskOperationContract.get.input,
	success: TaskOperationContract.get.success,
	error: [taskNotFoundHttp, taskUnavailableHttp],
});

const listTasksHttp = HttpApiEndpoint.get(TaskOperationContract.list.name, "/", {
	success: TaskOperationContract.list.success,
	error: taskUnavailableHttp,
});

const createTaskHttp = HttpApiEndpoint.post(TaskOperationContract.create.name, "/", {
	success: TaskOperationContract.create.success,
	error: taskUnavailableHttp,
	payload: TaskOperationContract.create.payload,
});

export const TaskApi = HttpApi.make("TaskApi").add(
	HttpApiGroup.make("Tasks").add(getTaskHttp, listTasksHttp, createTaskHttp),
);
