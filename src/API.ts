import { token } from "./Main";
import type { GetDMListResponse, GetGroupListResponse, GetMessageListResponse, GetRoomListResponse, GetUserResponse, UpdateLastReadMessageResponse } from "./Type/APIResponseType";
import type { Group } from "./Type/Group";
import type { Message } from "./Type/Message";
import type { Room } from "./Type/Room";
import type { User } from "./Type/User";

export async function get_user(user_id: string):Promise<User> {
	let ajax = await fetch("https://account.rumiserver.com/api/User?ID="+user_id, {
		headers: {
			"TOKEN": token
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
	let ajax = await fetch("/api/Group", {
		headers: {
			"TOKEN": token
		}
	});
	const result = (await ajax.json()) as GetGroupListResponse;
	if (result.STATUS) {
		return result.LIST;
	} else {
		throw new Error("取得できなかった");
	}
}

export async function get_dm_list():Promise<Room[]> {
	let ajax = await fetch("/api/DM", {
		headers: {
			"TOKEN": token
		}
	});
	const result = (await ajax.json()) as GetDMListResponse;
	if (result.STATUS) {
		return result.LIST;
	} else {
		throw new Error("取得できなかった");
	}
}


export async function get_room_list(group_id:string):Promise<Room[]> {
	let ajax = await fetch("/api/Room?GROUP_ID=" + group_id, {
		headers: {
			"TOKEN": token
		}
	});
	const result = (await ajax.json()) as GetRoomListResponse;
	if (result.STATUS) {
		return result.LIST;
	} else {
		throw new Error("取得できなかった");
	}
}

export async function get_message_list(room_id:string):Promise<{MESSAGE:Message, ACCOUNT:User}[]> {
	let ajax = await fetch("/api/Message?ROOM_ID=" + room_id, {
		headers: {
			"TOKEN": token
		}
	});
	const result = (await ajax.json()) as GetMessageListResponse;
	if (result.STATUS) {
		return result.LIST;
	} else {
		throw new Error("取得できなかった");
	}
}

export async function update_last_read_message(room_id:string) {
	let ajax = await fetch("/api/Ack?ROOM_ID=" + room_id, {
		headers: {
			"TOKEN": token
		}
	});
	const result = (await ajax.json()) as UpdateLastReadMessageResponse;
	if (result.STATUS) {
		return;
	} else {
		throw new Error("あ");
	}
}