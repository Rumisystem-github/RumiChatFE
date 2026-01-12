import { defineConfig } from "vite";
import { resolve } from "node:path";
import pkg from "./package.json";

export default defineConfig({
	define: {
		"import.meta.env.APP_VERSION": JSON.stringify(pkg.version)
	},
	build: {
		rollupOptions: {
			input: {
				index: resolve(__dirname, "index.html"),
				invite: resolve(__dirname, "invite.html"),
			},
		},
	},
});
