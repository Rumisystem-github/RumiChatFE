import { decompress } from "./Compresser";
import { token } from "./Main";
import type { DeleteMessageResponse, EditInviteResponse, GetDMListResponse, GetGroupListResponse, GetGroupResponse, GetInviteListResponse, GetMessageListResponse, GetRoomListResponse, GetRoomResponse, GetSettingResponse, GetUserResponse, UpdateLastReadMessageResponse, UpdateSettingResponse } from "./Type/APIResponseType";
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
			"Accept": "application/json",
			"RSV-Accept-Encode": "Zstd"
		}
	});
	const result = JSON.parse(await decompress(await ajax.blob()));
	return result;
}

async function api_delete(path: string): Promise<object> {
	let ajax = await fetch("/api" + path, {
		method: "DELETE",
		headers: {
			"TOKEN": token,
			"Content-Type": "application/json",
			"Accept": "application/json",
			"RSV-Accept-Encode": "Zstd"
		}
	});
	const result = JSON.parse(await decompress(await ajax.blob()));
	return result;
}

async function api_patch(path: string, body: object): Promise<object> {
	let ajax = await fetch("/api" + path, {
		method: "PATCH",
		headers: {
			"TOKEN": token,
			"Content-Type": "application/json",
			"Accept": "application/json",
			"RSV-Accept-Encode": "Zstd"
		},
		body: JSON.stringify(body)
	});
	const result = JSON.parse(await decompress(await ajax.blob()));
	return result;
}

export async function get_user(user_id: string):Promise<User> {
	let ajax = await fetch("https://account.rumiserver.com/api/User?ID="+user_id, {
		headers: {
			"TOKEN": token,
			"Content-Type": "application/json",
			"Accept": "application/json",
			"RSV-Accept-Encode": "Zstd"
		}
	});
	const result = (JSON.parse(await decompress(await ajax.blob()))) as GetUserResponse;
	if (result.STATUS) {
		return result.ACCOUNT;
	} else {
		throw new Error("取得できなかった");
	}
}

export async function get_group(group_id: string):Promise<Group> {
	const result = (await api_get("/Group?ID=" + group_id)) as GetGroupResponse;
	if (result.STATUS) {
		return result.GROUP;
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
		throw new Error("取得できなかった" + JSON.stringify(result));
	}
}

export async function get_room(room_id:string):Promise<Room> {
	const result = (await api_get("/Room?ID=" + room_id)) as GetRoomResponse;
	if (result.STATUS) {
		return result.ROOM;
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

export async function delete_message(message_id:string) {
	const result = (await api_delete("/Message?ID=" + message_id)) as DeleteMessageResponse;
	if (result.STATUS) {
		return;
	} else {
		throw new Error("削除失敗");
	}
}

export async function get_invite_list(group_id:string):Promise<User[]> {
	const result = (await api_get("/Invite?GROUP_ID=" + group_id)) as GetInviteListResponse;
	if (result.STATUS) {
		return result.LIST;
	} else {
		throw new Error("取得できなかった");
	}
}

export async function edit_invite_list(group_id:string, user_id:string, accept: boolean) {
	const result = (await api_patch("/Invite", {
		GROUP_ID: group_id,
		USER_ID: user_id,
		ACCEPT: accept
	})) as EditInviteResponse;
	if (!result.STATUS) {
		throw new Error("変更失敗");
	}
}

export async function get_setting():Promise<object> {
	const result = (await api_get("/Setting")) as GetSettingResponse;
	if (result.STATUS) {
		return result.SETTING;
	} else {
		throw new Error("取得できなかった");
	}
}

export async function update_setting(setting:object) {
	const result = (await api_patch("/Setting", setting)) as UpdateSettingResponse;
	if (!result.STATUS) {
		throw new Error("変更失敗" + JSON.stringify(result));
	}
}