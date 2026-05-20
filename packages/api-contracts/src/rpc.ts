import { Rpc, RpcGroup } from "effect/unstable/rpc";

import { TaskOperationContract } from "./task-operation-contract.ts";

export const listTasksRpc = Rpc.make(TaskOperationContract.list.name, {
	success: TaskOperationContract.list.success,
	error: TaskOperationContract.list.error,
});

export const getTaskRpc = Rpc.make(TaskOperationContract.get.name, {
	success: TaskOperationContract.get.success,
	error: TaskOperationContract.get.error,
	payload: TaskOperationContract.get.input,
});

export const createTaskRpc = Rpc.make(TaskOperationContract.create.name, {
	success: TaskOperationContract.create.success,
	error: TaskOperationContract.create.error,
	payload: TaskOperationContract.create.input,
});

export class TaskRpc extends RpcGroup.make(listTasksRpc, getTaskRpc, createTaskRpc) {}

export type TaskRpcs = RpcGroup.Rpcs<typeof TaskRpc>;
