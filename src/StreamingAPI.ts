import { token } from "./Main";
import zstd_init, { type ZstdAPI } from "./Lib/zstd";
import type { EventReceive, HandshakeResponse, ReveiveMessageEvent } from "./Type/StreamingAPIResponse";
import { loading_end_progress, loading_print_failed, loading_print_info, loading_print_progress, PREFIX_FAILED, PREFIX_OK } from "./Loading";

let zstd: ZstdAPI;
let ws:WebSocket;
let initial = true;
let event_listener_receive_message:(e: ReveiveMessageEvent) => void;

//初回
let handshake = false;
let helo_load = "";

export async function streaming_init() {
	zstd = await zstd_init();
}

export async function connect() {
	if (initial) helo_load = loading_print_progress("WebSocketに接続しています");

	ws = new WebSocket("/api/ws?ENCODE=ZSTD");
	ws.onopen = on_open;
	ws.onmessage = on_message;
	ws.onclose = on_close;

	if (initial) {
		ws.onerror = function() {
			loading_end_progress(helo_load, PREFIX_FAILED);
			loading_print_failed("WebSocketへの接続に失敗しました、鯖が落ちてるかも。");
		};
	}
}

export function set_receive_message_event(fn: (e: ReveiveMessageEvent) => void) {
	event_listener_receive_message = fn;
}

async function on_open() {
	if (initial) {
		loading_end_progress(helo_load, PREFIX_OK);
		helo_load = loading_print_progress("WebSocketﾊﾝﾄﾞｼｪｲｸ...");
	}

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
			if (initial) {
				loading_end_progress(helo_load, PREFIX_FAILED);
				loading_print_failed("WebSocketがｴﾗｰを返しました。");
			}
			return;
		}

		if (initial) loading_end_progress(helo_load, PREFIX_OK);

		initial = false;
		handshake = true;
	}
}

function on_close() {
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