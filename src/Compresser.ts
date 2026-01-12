import type { ZstdAPI } from "./Lib/zstd";
import zstd_init from "./Lib/zstd";
import { console_print, PREFIX_INFO } from "./Log";

let zstd: ZstdAPI;

export async function compresser_init() {
	zstd = await zstd_init();
}

export async function compress(text: string): Promise<Uint8Array> {
	const level = 3;
	const data = new TextEncoder().encode(text);

	const rs = new ReadableStream({
		start(controller) {
			controller.enqueue(data);
			controller.close();
		}
	});

	const cs = rs.pipeThrough(new zstd.Compresser(level));
	const compressed_blob = await new Response(cs).blob();
	const array_buffer = await compressed_blob.arrayBuffer();
	const compressed = new Uint8Array(array_buffer);

	if (import.meta.env.DEV) {
		const before_size = data.length;
		const after_size = compressed.length;
		const persent = Math.floor(((before_size - after_size) / before_size) * 100);
		console_print(PREFIX_INFO, `圧縮：${before_size}バイト→${after_size}バイト (${persent}%削減)`);
	}
	return compressed;
}

export async function decompress(input: Blob): Promise<string> {
	const ds = new zstd.Decompresser();
	const decompressed_stream = input.stream().pipeThrough(ds);
	const decompressed_blob = await new Response(decompressed_stream).blob();
	const text = decompressed_blob.text();

	if (import.meta.env.DEV) {
		const before_size = decompressed_blob.size;
		const after_size = input.size;
		const persent = Math.floor(((before_size - after_size) / before_size) * 100);
		console_print(PREFIX_INFO, `解凍：${before_size}バイト→${after_size}バイト (${persent}%削減)`);
	}

	return text;
}