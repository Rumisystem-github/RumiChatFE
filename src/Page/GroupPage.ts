import { get_group } from "../API";
import { mel } from "../Main";
import { refresh_room_list } from "../UI";

export async function start(group_id: string) {
	//部屋一覧
	await refresh_room_list(group_id);

	//グループ取得
	const group = await get_group(group_id);
	mel.side.group_header.title.innerText = group.NAME + "︙";

	mel.side.group_header.parent.style.display = "block";
	mel.side.room_list.style.display = "block";
}