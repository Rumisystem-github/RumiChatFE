import { token } from "./Main";
import zstd_init, { type ZstdAPI } from "./Lib/zstd";

let zstd: ZstdAPI;
let ws:WebSocket;

export async function connect() {
	zstd = await zstd_init();

	ws = new WebSocket("/api/ws?ENCODE=ZSTD");
	ws.onopen = on_open;
	ws.onmessage = on_message;
	ws.onclose = on_close;
}

async function on_open() {
	console.log("接続");
	ws.send(await compress(JSON.stringify(["HELO", token])));
}

async function on_message(e:MessageEvent) {
	const text = await decompress(e.data);
	console.log("受信：" + text);
}

function on_close() {
	console.log("切断");
	connect();
}

async function compress(text: string): Promise<Uint8Array> {
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

	const before_size = data.length;
	const after_size = compressed.length;
	const persent = Math.floor(((before_size - after_size) / before_size) * 100);
	console.log(`送信を圧縮：${before_size}バイト→${after_size}バイト (${persent}%削減)`);

	return compressed;
}

async function decompress(input: Blob): Promise<string> {
	const ds = new zstd.Decompresser();
	const decompressed_stream = input.stream().pipeThrough(ds);
	const decompressed_blob = await new Response(decompressed_stream).blob();
	const text = decompressed_blob.text();

	const before_size = decompressed_blob.size;
	const after_size = input.size;
	const persent = Math.floor(((before_size - after_size) / before_size) * 100);
	console.log(`受信を解凍：${before_size}バイト→${after_size}バイト (${persent}%削減)`);

	return text;
}