import { mel } from "../Main";
import { refresh_dm_list } from "../UI";

const GROUP_REGEX = /^\/chat\/([^/]+)\/?$/;
const ROOM_REGEX = /^\/chat\/([^/]+)\/([^/]+)\/?$/;
const DM_REGEX = /^\/dm\/([^/]+)\/?$/;

//パスを読んでページを検知
export async function page_detect() {
	const path = window.location.pathname;
	console.info(path);

	if (path == "/") {
		//トップ
		await refresh_dm_list();
		mel.side.dm_list.style.display = "block";
		hide(path);
		return;
	}

	//設定
	if (path.startsWith("/setting")) {
		const chatroom = await import("./SettingPage");
		await chatroom.start(path);
	}

	//グループ
	const group_mtc = path.match(GROUP_REGEX);
	if (group_mtc) {
		const group_id = group_mtc[1];

		const script = await import("./GroupPage");
		await script.start(group_id);
	}

	//部屋
	const room_mtc = path.match(ROOM_REGEX);
	if (room_mtc) {
		const group_id = room_mtc[1];
		const room_id = room_mtc[2];

		const chatroom = await import("./ChatPage");
		await chatroom.start(group_id, room_id);
	}

	//DM
	const dm_mtc = path.match(DM_REGEX);
	if (dm_mtc) {
		const room_id = dm_mtc[1];
		const chatroom = await import("./ChatPage");
		await chatroom.start(null, room_id);
	}

	hide(path);
}

function hide(path: string) {
	let h = {
		group_header: false,
		room_list: false,
		dm_list: false,
		setting_list: false,
		chat_room: false,
		setting: false
	};

	if (path == "/") {
		h.dm_list = true;
	} else if (path.startsWith("/setting")) {
		h.setting = true;
		h.setting_list = true;
	} else if (path.match(GROUP_REGEX)) {
		h.group_header = true;
		h.room_list = true;
	} else if (path.match(ROOM_REGEX)) {
		h.group_header = true;
		h.room_list = true;
		h.chat_room = true;
	} else if (path.match(DM_REGEX)) {
		h.dm_list = true;
		h.chat_room = true;
	}

	if (!h.group_header) mel.side.group_header.parent.style.display = "none";
	if (!h.room_list) mel.side.room_list.style.display = "none";
	if (!h.dm_list) mel.side.dm_list.style.display = "none";
	if (!h.chat_room) mel.contents.chat.parent.style.display = "none";
	if (!h.setting_list) mel.side.setting_list.style.display = "none";
	if (!h.setting) mel.contents.setting.parent.style.display = "none";
}