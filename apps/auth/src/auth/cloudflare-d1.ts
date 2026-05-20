import * as Cloudflare from "alchemy/Cloudflare";
import { WorkerEnvironment } from "alchemy/Cloudflare/Workers";
import { betterAuth as makeBetterAuth } from "better-auth";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { HttpServerRequest } from "effect/unstable/http/HttpServerRequest";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";

import { BetterAuth } from "./better-auth.ts";

const passwordIterations = 100_000;

const bytesToBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

const base64ToBytes = (text: string) => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

const derivePasswordHash = async (password: string, salt: Uint8Array) => {
	const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
		"deriveBits",
	]);
	const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;
	const bits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			hash: "SHA-256",
			salt: saltBuffer,
			iterations: passwordIterations,
		},
		key,
		256,
	);
	return new Uint8Array(bits);
};

const hashPassword = async (password: string) => {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const hash = await derivePasswordHash(password, salt);
	return `pbkdf2-sha256$${passwordIterations}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
};

const verifyPassword = async ({ hash, password }: { hash: string; password: string }) => {
	const [algorithm, iterations, salt, expected] = hash.split("$");
	if (algorithm !== "pbkdf2-sha256" || iterations !== String(passwordIterations) || !salt || !expected) {
		return false;
	}
	const actual = await derivePasswordHash(password, base64ToBytes(salt));
	return bytesToBase64(actual) === expected;
};

export const CloudflareD1 = Layer.effect(
	BetterAuth,
	Effect.gen(function* () {
		const d1 = yield* Cloudflare.D1Database("BetterAuth", {
			migrationsDir: "./migrations",
		});
		const connection = yield* Cloudflare.D1Connection.bind(d1);

		const auth = yield* Effect.gen(function* () {
			const env = yield* WorkerEnvironment;
			const betterAuth = makeBetterAuth({
				database: yield* connection.raw,
				emailAndPassword: {
					enabled: true,
					password: {
						hash: hashPassword,
						verify: verifyPassword,
					},
				},
				secret: env.BETTER_AUTH_SECRET,
			});
			return betterAuth;
		}).pipe(Effect.cached);

		return {
			auth,
			fetch: Effect.gen(function* () {
				const request = yield* HttpServerRequest;
				const betterAuth = yield* auth;
				const response = yield* Effect.promise(() => betterAuth.handler(request.source as Request));
				return HttpServerResponse.fromWeb(response);
			}),
		};
	}),
).pipe(Layer.provide(Cloudflare.D1ConnectionLive));
