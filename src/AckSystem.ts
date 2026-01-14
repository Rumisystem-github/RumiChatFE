import type { MessageAckEvent, ReveiveMessageEvent } from "./Type/StreamingAPIResponse";

export async function ack_event(e:MessageAckEvent) {
	room_ack(e.ROOM_ID, true);

	if (e.IS_DM) {
		//DM
		dm_ack(e.DM_USER_ID!, true);
	} else {
		//グループ
		group_ack(e.GROUP_ID!, true);
	}
}

export async function receive_message_event(e:ReveiveMessageEvent) {
	room_ack(e.ROOM_ID, false);

	if (e.GROUP_ID != null) {
		group_ack(e.GROUP_ID, false);
	} else {
		dm_ack(e.USER.ID, false);
	}
}

function room_ack(room_id: string, ack:boolean) {
	const item = document.querySelector(`.ROOM_ITEM[data-id="${room_id}"]`);
	if (item != null) {
		let el = item as HTMLElement;
		if (ack) {
			el.dataset["ack"] = "true";
		} else {
			el.dataset["ack"] = "false";
		}
	}
}

function group_ack(group_id: string, ack:boolean) {
	const item = document.querySelector(`.GROUP_ITEM[data-id="${group_id}"]`);
	if (item != null) {
		let el = item as HTMLElement;
		if (ack) {
			el.dataset["ack"] = "true";
		} else {
			el.dataset["ack"] = "false";
		}
	}
}

function dm_ack(user_id: string, ack:boolean) {
	const item = document.querySelector(`.DM_ITEM[data-user_id="${user_id}"]`);
	if (item != null) {
		let el = item as HTMLElement;
		if (ack) {
			el.dataset["ack"] = "true";
		} else {
			el.dataset["ack"] = "false";
		}
	}
}