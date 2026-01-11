export type PrefixData = {
	text: string,
	color: string
};

export const PREFIX_INFO: PrefixData = {text: " INFO ", color: "rgb(0, 0, 0)"};
export const PREFIX_OK: PrefixData = {text: "  OK  ", color: "rgb(0, 255, 0)"};
export const PREFIX_FAILED: PrefixData = {text: "FAILED", color: "rgb(255, 0, 0)"};

export function console_print(prefix: PrefixData, message: string) {
	if (!import.meta.env.DEV) return;

	console.log(`[%c${prefix.text}%c] ${message}`, `color: ${prefix.color};`);
}