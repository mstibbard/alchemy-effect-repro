import { Client } from "@repo/api/client";
import * as Effect from "effect/Effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import React from "react";
import ReactDOM from "react-dom/client";

const client = Client(import.meta.env.VITE_API_URL!).pipe(Effect.provide(FetchHttpClient.layer));

const result = await client.pipe(
	Effect.flatMap((client) =>
		Effect.gen(function* () {
			const created = yield* client.createTask({ title: "Created from web via RPC" });
			const found = yield* client.getTask({ id: created.id });

			return { created, found };
		}),
	),
	Effect.scoped,
	Effect.runPromise,
);

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<main>
			<h1>API RPC proof</h1>
			<pre>{JSON.stringify(result, null, 2)}</pre>
		</main>
	</React.StrictMode>,
);
