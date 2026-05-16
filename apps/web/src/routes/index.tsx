import { TaskRpc } from "@repo/api/rpc";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import * as Effect from "effect/Effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";
import { useEffect, useState } from "react";

import { env } from "../env.ts";

const runEffectRpcProof = createServerFn({ method: "GET" }).handler(async () => {
	return Effect.gen(function* () {
		const api = yield* RpcClient.make(TaskRpc);

		const created = yield* api.createTask({
			title: `Effect HTTP RPC over Cloudflare service binding from @repo/web at ${new Date().toISOString()}`,
		});
		const found = yield* api.getTask({ id: created.id });
		const recoveredMissingTask = yield* api.getTask({ id: "definitely-missing" }).pipe(
			Effect.catchTag("TaskNotFound", (error) =>
				Effect.succeed({
					_tag: "RecoveredTaskNotFound" as const,
					id: error.id,
				}),
			),
		);

		return {
			created: {
				id: created.id,
				title: created.title,
				completed: created.completed,
			},
			found: {
				id: found.id,
				title: found.title,
				completed: found.completed,
			},
			recoveredMissingTask,
		};
	}).pipe(
		Effect.provide(
			RpcClient.layerProtocolHttp({
				url: "https://api.internal/rpc",
			}),
		),
		Effect.provide(RpcSerialization.layerJson),
		Effect.provide(FetchHttpClient.layer),
		Effect.provideService(FetchHttpClient.Fetch, env.API.fetch.bind(env.API)),
		Effect.scoped,
		Effect.runPromise,
	);
});

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	const [proof, setProof] = useState<Awaited<ReturnType<typeof runEffectRpcProof>> | undefined>();
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		runEffectRpcProof()
			.then(setProof)
			.catch((error) => setError(error instanceof Error ? error.message : String(error)));
	}, []);

	return (
		<div className="p-8">
			<h1 className="text-4xl font-bold">Effect HTTP RPC over Cloudflare service binding</h1>
			<p className="mt-4 text-lg">
				This page uses Effect's built-in HTTP RPC transport through a Cloudflare service binding. It proves success
				decoding, follow-up RPC composition, and typed Effect error recovery via{" "}
				<code>Effect.catchTag("TaskNotFound")</code>.
			</p>
			<pre className="mt-4 rounded bg-gray-100 p-4 text-sm">
				{error ? `Error: ${error}` : proof ? JSON.stringify(proof, null, 2) : "Loading Effect RPC proof..."}
			</pre>
		</div>
	);
}
