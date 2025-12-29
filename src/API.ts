import { token } from "./Main";
import type { GetDMListResponse, GetGroupListResponse, GetMessageListResponse, GetRoomListResponse, GetUserResponse, UpdateLastReadMessageResponse } from "./Type/APIResponseType";
import type { Group } from "./Type/Group";
import type { Message } from "./Type/Message";
import type { Room } from "./Type/Room";
import type { User } from "./Type/User";

async function api_get(path: string): Promise<object> {
	let ajax = await fetch("/api" + path, {
		method: "GET",
		headers: {
			"TOKEN": token,
			"Content-Type": "application/json",
			"Accept": "application/json"
		}
	});
	const result = await ajax.json();
	return result;
}

async function api_patch(path: string, body: object): Promise<object> {
	let ajax = await fetch("/api" + path, {
		method: "PATCH",
		headers: {
			"TOKEN": token,
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		body: JSON.stringify(body)
	});
	const result = await ajax.json();
	return result;
}

export async function get_user(user_id: string):Promise<User> {
	let ajax = await fetch("https://account.rumiserver.com/api/User?ID="+user_id, {
		headers: {
			"TOKEN": token,
			"Content-Type": "application/json",
			"Accept": "application/json"
		}
	});
	const result = (await ajax.json()) as GetUserResponse;
	if (result.STATUS) {
		return result.ACCOUNT;
	} else {
		throw new Error("取得できなかった");
	}
}

export async function get_group_list():Promise<Group[]> {
	const result = (await api_get("/Group")) as GetGroupListResponse;
	if (result.STATUS) {
		return result.LIST;
	} else {
		throw new Error("取得できなかった");
	}
}

export async function get_dm_list():Promise<Room[]> {
	const result = (await api_get("/DM")) as GetDMListResponse;
	if (result.STATUS) {
		return result.LIST;
	} else {
		throw new Error("取得できなかった");
	}
}


export async function get_room_list(group_id:string):Promise<Room[]> {
	const result = (await api_get("/Room?GROUP_ID=" + group_id)) as GetRoomListResponse;
	if (result.STATUS) {
		return result.LIST;
	} else {
		throw new Error("取得できなかった");
	}
}

export async function get_message_list(room_id:string):Promise<{MESSAGE:Message, ACCOUNT:User}[]> {
	const result = (await api_get("/Message?ROOM_ID=" + room_id)) as GetMessageListResponse;
	if (result.STATUS) {
		return result.LIST;
	} else {
		throw new Error("取得できなかった");
	}
}

export async function update_last_read_message(room_id:string) {
	const result = (await api_patch("/Ack?ROOM_ID=" + room_id, {})) as UpdateLastReadMessageResponse;
	if (result.STATUS) {
		return;
	} else {
		throw new Error("あ");
	}
}