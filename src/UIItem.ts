import type { Group } from "./Type/Group";
import type { Message } from "./Type/Message";
import type { Room } from "./Type/Room";
import type { User } from "./Type/User";

export function uiitem_group_item(group: Group):HTMLElement {
	let parent = document.createElement("A") as HTMLAnchorElement;
	parent.href = `/chat/${group.ID}`;

	let item = document.createElement("DIV");
	parent.appendChild(item);
	item.className = "GROUP_ITEM";
	item.dataset["id"] = group.ID;

	let icon = document.createElement("DIV");
	icon.innerText = group.NAME;
	item.appendChild(icon);

	return parent;
}

export function uiitem_room_item(group_id:string, room: Room):HTMLElement {
	let parent = document.createElement("A") as HTMLAnchorElement;
	parent.href = `/chat/${group_id}/${room.ID}`;

	let item = document.createElement("DIV");
	parent.appendChild(item);
	item.className = "ROOM_ITEM";
	item.dataset["id"] = room.ID;

	let name = document.createElement("DIV");
	name.innerText = room.NAME;
	item.appendChild(name);

	return parent;
}

export async function uiitem_message_item(user: User, message: Message):Promise<HTMLElement> {
	let item = document.createElement("DIV");
	item.className = "MESSAGE_ITEM";
	item.dataset["id"] = message.ID;

	let user_el = document.createElement("DIV");
	user_el.className = "USER";
	item.appendChild(user_el);

	let user_icon_el = document.createElement("IMG") as HTMLImageElement;
	user_icon_el.className = "USER_ICON ICON_" + user.ICON;
	user_icon_el.src = "https://account.rumiserver.com/api/Icon?UID=" + user.UID;
	user_el.appendChild(user_icon_el);

	let user_name_el = document.createElement("SPAN");
	user_name_el.className = "USER_NAME";
	user_name_el.innerText = user.NAME;
	user_el.appendChild(user_name_el);

	let date_el = document.createElement("SPAN");
	date_el.className = "DATE";
	date_el.innerHTML = " | " + message.CREATE_AT;
	user_el.appendChild(date_el);

	let text_el = document.createElement("DIV");
	text_el.className = "TEXT";
	text_el.innerText = message.TEXT;
	item.appendChild(text_el);

	return item;
}