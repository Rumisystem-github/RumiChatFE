import { mel } from "../Main";
import { refresh_dm_list } from "../UI";

//パスを読んでページを検知
export async function page_detect() {
	const path = window.location.pathname;
	console.info(path);

	mel.side.group_header.parent.style.display = "none";
	mel.side.room_list.style.display = "none";
	mel.side.dm_list.style.display = "none";
	mel.contents.chat.parent.style.display = "none";

	mel.side.setting_list.style.display = "none";
	mel.contents.setting.parent.style.display = "none";

	if (path == "/") {
		//トップ
		await refresh_dm_list();
		mel.side.dm_list.style.display = "block";
		return;
	}

	//設定
	if (path.startsWith("/setting")) {
		const chatroom = await import("./SettingPage");
		await chatroom.start(path);
	}

	//グループ
	const group_mtc = path.match(/^\/chat\/([^/]+)\/?$/);
	if (group_mtc) {
		const group_id = group_mtc[1];

		const script = await import("./GroupPage");
		await script.start(group_id);
	}

	//部屋
	const room_mtc = path.match(/^\/chat\/([^/]+)\/([^/]+)\/?$/);
	if (room_mtc) {
		const group_id = room_mtc[1];
		const room_id = room_mtc[2];

		const chatroom = await import("./ChatPage");
		await chatroom.start(group_id, room_id);
	}

	//DM
	const dm_mtc = path.match(/^\/dm\/([^/]+)\/?$/);
	if (dm_mtc) {
		const room_id = dm_mtc[1];
		const chatroom = await import("./ChatPage");
		await chatroom.start(null, room_id);
	}
}