import {defineConfig} from "vitest/config";

export default defineConfig({
	test: {
		watch: false,
		globals: true,
		include: ["test/TU/lib/**/*.test.ts"],
		coverage: {
			provider: "istanbul",
			reporter: ["text", "json", "html"],
			reportsDirectory: "coverage"
		}
	},
});
