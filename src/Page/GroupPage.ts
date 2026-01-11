import { get_group } from "../API";
import { init_group_menu } from "../GroupMenu";
import { mel } from "../Main";
import { refresh_room_list } from "../UI";

let open_group_id:string;

export async function start(group_id: string) {
	open_group_id = group_id;

	//部屋一覧
	await refresh_room_list(open_group_id);

	//グループ取得
	const group = await get_group(open_group_id);
	mel.side.group_header.title.innerText = group.NAME + "︙";

	init_group_menu(open_group_id);

	mel.side.group_header.parent.style.display = "block";
	mel.side.room_list.style.display = "block";
}