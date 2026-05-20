import { expect } from "bun:test";

import * as Cloudflare from "alchemy/Cloudflare";
import * as Test from "alchemy/Test/Bun";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import * as HttpBody from "effect/unstable/http/HttpBody";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";

import Stack from "../alchemy.run.ts";
import { Client } from "../src/client.ts";
import { Task } from "../src/task.ts";

const { test, beforeAll, afterAll, deploy, destroy } = Test.make({
	providers: Cloudflare.providers(),
	state: Cloudflare.state(),
});

const stack = beforeAll(deploy(Stack));

test(
	"creates and retrieves a task",
	Effect.gen(function* () {
		const { url } = yield* stack;

		const create = yield* HttpClient.post(`${url}/`, {
			body: yield* HttpBody.json({ title: "Write an integration test" }),
		});
		expect(create.status).toBe(200);

		const created = yield* HttpClientResponse.schemaBodyJson(Task)(create);
		expect(created.title).toBe("Write an integration test");
		expect(created.completed).toBe(false);

		const get = yield* HttpClient.get(`${url}/${created.id}`);
		expect(get.status).toBe(200);

		const retrieved = yield* HttpClientResponse.schemaBodyJson(Task)(get);
		expect(retrieved).toEqual(created);

		const list = yield* HttpClient.get(`${url}/`);
		expect(list.status).toBe(200);

		const tasks = yield* HttpClientResponse.schemaBodyJson(Schema.Array(Task))(list);
		expect(tasks).toContainEqual(created);
	}),
);

test(
	"creates and retrieves a task over rpc",
	Effect.gen(function* () {
		const { url } = yield* stack;
		const client = yield* Client(url!);

		const created = yield* client.createTask({ title: "Write an RPC integration test" });
		expect(created.title).toBe("Write an RPC integration test");
		expect(created.completed).toBe(false);

		const retrieved = yield* client.getTask({ id: created.id });
		expect(retrieved).toEqual(created);

		const recoveredMissingTask = yield* client
			.getTask({ id: "missing-rpc-task" })
			.pipe(Effect.catchTag("TaskNotFound", (error) => Effect.succeed(error)));
		expect(recoveredMissingTask.id).toBe("missing-rpc-task");
	}).pipe(Effect.scoped, Effect.provide(FetchHttpClient.layer)),
);

afterAll.skipIf(!process.env.CI)(destroy(Stack));
