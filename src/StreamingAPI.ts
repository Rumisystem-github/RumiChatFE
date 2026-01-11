import { reload_group_list, token } from "./Main";
import type { DeleteMessageEvent, EventReceive, HandshakeResponse, ReveiveMessageEvent } from "./Type/StreamingAPIResponse";
import { loading_end_progress, loading_print_failed, loading_print_progress } from "./Loading";
import { compress, decompress } from "./Compresser";
import { PREFIX_FAILED, PREFIX_OK } from "./Log";

let ws:WebSocket;
let initial = true;
let event_listener_receive_message:(e: ReveiveMessageEvent) => void;
let event_listener_delete_message:(e: DeleteMessageEvent) => void;

//初回
let handshake = false;
let helo_load = "";

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

export function set_delete_message_event(fn: (e: DeleteMessageEvent) => void) {
	event_listener_delete_message = fn;
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
			case "DELETE_MESSAGE":
				const delete_message = json as DeleteMessageEvent;
				event_listener_delete_message(delete_message);
				return;
			case "UPDATE_GROUP_LIST":
				await reload_group_list();
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
