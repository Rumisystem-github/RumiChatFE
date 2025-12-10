import { mel } from "../Main";

//パスを読んでページを検知
export async function page_detect() {
	const path = window.location.pathname;
	console.info(path);

	mel.side.room_list.style.display = "none";
	mel.chat.parent.style.display = "none";

	if (path == "/") {
		//トップ
		return;
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
}