import { mel } from "../Main";
import { refresh_room_list } from "../UI";

export async function start(group_id: string) {
	//部屋一覧
	await refresh_room_list(group_id);
	mel.side.room_list.style.display = "block";
}