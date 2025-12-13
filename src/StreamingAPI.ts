import { token } from "./Main";
import zstd_init, { type ZstdAPI } from "./Lib/zstd";
import type { EventReceive, HandshakeResponse, ReveiveMessageEvent } from "./Type/StreamingAPIResponse";

let zstd: ZstdAPI;
let ws:WebSocket;
let handshake = false;
let event_listener_receive_message:(e: ReveiveMessageEvent) => void;

export async function streaming_init() {
	zstd = await zstd_init();
}

export async function connect() {
	ws = new WebSocket("/api/ws?ENCODE=ZSTD");
	ws.onopen = on_open;
	ws.onmessage = on_message;
	ws.onclose = on_close;
}

export function set_receive_message_event(fn: (e: ReveiveMessageEvent) => void) {
	event_listener_receive_message = fn;
}

async function on_open() {
	console.log("接続");
	ws.send(await compress(JSON.stringify(["HELO", token])));
}

async function on_message(e:MessageEvent) {
	const text = await decompress(e.data);
	const json = JSON.parse(text);
	if (handshake) {
		const event = json as EventReceive;
		switch (event.TYPE) {
			case "RECEIVE_MESSAGE":
				const receive_message = json as ReveiveMessageEvent;
				event_listener_receive_message(receive_message);
				return;
		}
	} else {
		const res = json as HandshakeResponse;
		if (!res.STATUS) {
			alert("WebSocketエラー");
		}

		handshake = true;
	}
}

function on_close() {
	console.log("切断");
	handshake = false;
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