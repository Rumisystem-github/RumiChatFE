import { get_room_list } from "./API";
import { dm_list, join_group_list, mel } from "./Main";
import { replace_element } from "./SPA";
import { uiitem_dm_item, uiitem_group_item, uiitem_room_item } from "./UIItem";

export function refresh_group_list() {
	let el_list:HTMLElement[] = [];

	join_group_list.forEach(group => {
		el_list.push(uiitem_group_item(group));
	});

	replace_element(mel.top.group_list, el_list);
}

export async function refresh_room_list(group_id: string) {
	let el_list:HTMLElement[] = [];

	const list = await get_room_list(group_id);
	list.forEach(room => {
		el_list.push(uiitem_room_item(group_id, room));
	});

	replace_element(mel.side.room_list, el_list);
}

export async function refresh_dm_list() {
	let el_list:HTMLElement[] = [];

	for (const dm of dm_list) {
		el_list.push(uiitem_dm_item(dm));
	}

	replace_element(mel.side.dm_list, el_list);
}