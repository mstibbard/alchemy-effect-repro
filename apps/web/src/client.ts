import { Client, makeClientLive } from "@repo/api-contracts/client";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";

const ApiConfigSchema = Schema.Struct({
	baseUrl: Schema.URLFromString,
});

export class ApiConfigError extends Schema.TaggedClass<ApiConfigError>()("ApiConfigError", {
	message: Schema.String,
}) {}

export class ApiConfig extends Context.Service<ApiConfig, typeof ApiConfigSchema.Type>()("ApiConfig") {}
export { Client };

export const ApiConfigLive = Layer.effect(ApiConfig)(
	Schema.decodeUnknownEffect(ApiConfigSchema)({
		baseUrl: import.meta.env.VITE_API_URL,
	}).pipe(Effect.mapError((error) => new ApiConfigError({ message: String(error) }))),
);

export const ClientLive = Layer.effect(Client)(
	Effect.gen(function* () {
		const config = yield* ApiConfig;
		return yield* Client.pipe(Effect.provide(makeClientLive(config.baseUrl.toString())));
	}),
).pipe(Layer.provide(ApiConfigLive));
