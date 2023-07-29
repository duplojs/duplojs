import {defineConfig} from "rollup";
import esbuild from "rollup-plugin-esbuild";

export default defineConfig([
	{
		input: "scripts/index.ts",
		output: [
			{
				file: "dist/anotherback.mjs",
				format: "esm"
			},
			{
				file: "dist/anotherback.cjs",
				format: "cjs",
			}
		],
		plugins: [
			esbuild({
				include: /\.[jt]sx?$/,
				exclude: /node_modules/,
				tsconfig: "tsconfig.json",
			})
		]
	}
]);
