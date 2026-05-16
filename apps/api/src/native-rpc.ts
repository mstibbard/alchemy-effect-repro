import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Latch from "effect/Latch";
import * as Queue from "effect/Queue";
import * as Scope from "effect/Scope";
import { RpcClient, RpcServer } from "effect/unstable/rpc";
import type * as Rpc from "effect/unstable/rpc/Rpc";
import type * as RpcGroup from "effect/unstable/rpc/RpcGroup";
import type { FromClientEncoded, FromServerEncoded } from "effect/unstable/rpc/RpcMessage";

type NativeRpcBinding = {
	effectRpc: (message: FromClientEncoded) => Promise<ReadonlyArray<FromServerEncoded>>;
};

export const makeNativeRpcHandler = <Rpcs extends Rpc.Any>(group: RpcGroup.RpcGroup<Rpcs>) => {
	return (message: FromClientEncoded) =>
		Effect.gen(function* () {
			const responses: Array<FromServerEncoded> = [];
			const done = yield* Latch.make(false);

			const protocol = RpcServer.Protocol.of({
				run: (handle) => handle(0, message).pipe(Effect.andThen(Effect.never)),
				disconnects: yield* Queue.unbounded<number>(),
				send: (_clientId, response) =>
					Effect.sync(() => {
						responses.push(response);
						if (response._tag === "Exit" || response._tag === "Defect" || response._tag === "Pong") {
							done.openUnsafe();
						}
					}),
				end: () => Effect.void,
				clientIds: Effect.succeed(new Set([0])),
				initialMessage: Effect.succeedNone,
				supportsAck: false,
				supportsTransferables: false,
				supportsSpanPropagation: true,
			});

			const scope = yield* Scope.make();
			const fiber = yield* RpcServer.make(group).pipe(
				Effect.provideService(RpcServer.Protocol, protocol),
				Scope.provide(scope),
				Effect.forkScoped,
			);

			yield* done.await;
			yield* Fiber.interrupt(fiber);
			yield* Scope.close(scope, Exit.void);

			return responses;
		});
};

export const makeNativeRpcClient = <Rpcs extends Rpc.Any>(
	group: RpcGroup.RpcGroup<Rpcs>,
	binding: NativeRpcBinding,
): Effect.Effect<RpcClient.RpcClient<Rpcs>, never, Scope.Scope | Rpc.MiddlewareClient<Rpcs>> =>
	Effect.gen(function* () {
		let writeResponse: ((response: FromServerEncoded) => Effect.Effect<void>) | undefined;

		const protocol = RpcClient.Protocol.of({
			run: (_clientId, f) =>
				Effect.sync(() => {
					writeResponse = f;
				}).pipe(Effect.andThen(Effect.never)),
			send: (_clientId, request) =>
				Effect.promise(() => binding.effectRpc(request)).pipe(
					Effect.flatMap((responses) =>
						Effect.forEach(responses, (response) => (writeResponse ? writeResponse(response) : Effect.void)),
					),
					Effect.asVoid,
				),
			supportsAck: false,
			supportsTransferables: false,
		});

		return yield* RpcClient.make(group).pipe(Effect.provideService(RpcClient.Protocol, protocol));
	});
