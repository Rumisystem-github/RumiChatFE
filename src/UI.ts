import { get_room_list } from "./API";
import { dm_list, join_group_list, mel } from "./Main";
import { uiitem_dm_item, uiitem_group_item, uiitem_room_item } from "./UIItem";

export function refresh_group_list() {
	mel.top.group_list.replaceChildren();
	join_group_list.forEach(group => {
		mel.top.group_list.appendChild(uiitem_group_item(group));
	});
}

export async function refresh_room_list(group_id: string) {
	mel.side.room_list.replaceChildren();
	const list = await get_room_list(group_id);
	list.forEach(room => {
		mel.side.room_list.appendChild(uiitem_room_item(group_id, room));
	});
}

export async function refresh_dm_list() {
	mel.side.dm_list.replaceChildren();

	for (const dm of dm_list) {
		mel.side.dm_list.appendChild(uiitem_dm_item(dm));
	}
}