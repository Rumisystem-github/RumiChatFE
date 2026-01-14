import { delete_message } from "./API";
import { open_user_profile, self_user, setting } from "./Main";
import type { DM } from "./Type/DM";
import type { Group } from "./Type/Group";
import type { Message, MessageFile } from "./Type/Message";
import type { Room } from "./Type/Room";
import type { RenkeiAccount, User } from "./Type/User";
import delete_icon_img from "./Asset/MaterialSymbolsDeleteOutline.svg";

export function uiitem_group_item(group: Group):HTMLElement {
	let parent = document.createElement("A") as HTMLAnchorElement;
	parent.href = `/chat/${group.ID}`;

	let item = document.createElement("DIV");
	parent.appendChild(item);
	item.className = "GROUP_ITEM";
	item.dataset["ack"] = "true";
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
	if (room.ACK) {
		item.dataset["ack"] = "true";
	} else {
		item.dataset["ack"] = "false";
	}
	item.dataset["id"] = room.ID;

	let name = document.createElement("DIV");
	name.innerText = room.NAME;
	item.appendChild(name);

	return parent;
}

export function uiitem_dm_item(dm: DM): HTMLElement {
	let parent = document.createElement("A") as HTMLAnchorElement;
	parent.href = "/dm/" + dm.room.ID;

	let item = document.createElement("DIV");
	item.className = "DM_ITEM";
	if (dm.room.ACK) {
		item.dataset["ack"] = "true";
	} else {
		item.dataset["ack"] = "false";
	}

	let icon = document.createElement("IMG") as HTMLImageElement;
	icon.className = "ICON_" + dm.user.ICON;
	icon.src = "https://account.rumiserver.com/api/Icon?UID=" + dm.user.UID;
	item.append(icon);

	let name = document.createElement("SPAN");
	name.innerText = dm.user.NAME;
	item.append(name);

	parent.append(item);
	return parent;
}

export async function uiitem_message_item(user: User, message: Message):Promise<HTMLElement> {
	let item = document.createElement("DIV");
	item.className = "MESSAGE_ITEM";
	item.dataset["id"] = message.ID;

	let menu = document.createElement("DIV");
	menu.className = "MENU";
	item.appendChild(menu);

	//削除ボタン
	if (user.ID == self_user.ID) {
		let delete_button = document.createElement("BUTTON") as HTMLButtonElement;
		delete_button.onclick = async function() {
			await delete_message(message.ID);
		};
		menu.append(delete_button);

		let delete_icon = document.createElement("IMG") as HTMLImageElement;
		delete_icon.src = delete_icon_img;
		delete_button.append(delete_icon);
	}

	let user_el = document.createElement("DIV");
	user_el.className = "USER";
	item.appendChild(user_el);

	let user_icon_el = document.createElement("IMG") as HTMLImageElement;
	user_icon_el.className = "USER_ICON ICON_" + user.ICON;
	user_icon_el.src = "https://account.rumiserver.com/api/Icon?UID=" + user.UID;
	user_el.appendChild(user_icon_el);
	user_icon_el.addEventListener("click", ()=>{
		open_user_profile(user.ID);
	});

	let user_name_el = document.createElement("SPAN");
	user_name_el.className = "USER_NAME";
	user_name_el.innerText = user.NAME;
	user_el.appendChild(user_name_el);

	let date_el = document.createElement("SPAN");
	date_el.className = "DATE";
	date_el.innerHTML = message.CREATE_AT;
	user_el.appendChild(date_el);

	let text_el = document.createElement("DIV");
	text_el.className = "TEXT";
	text_el.innerText = message.TEXT;
	item.appendChild(text_el);

	let file_el = document.createElement("DIV");
	file_el.className = "FILE_LIST";
	item.appendChild(file_el);

	for (let i = 0; i < message.FILE_LIST.length; i++) {
		const file = message.FILE_LIST[i];
		file_el.appendChild(await uiitem_message_file(file));
	}

	return item;
}

export async function uiitem_message_file(file:MessageFile):Promise<HTMLDivElement> {
	let file_item = document.createElement("DIV")as HTMLDivElement;

	if (!setting.message_image_preview) {
		let a = document.createElement("A") as HTMLAnchorElement;
		a.href = file.URL;
		a.innerText = "添付ファイル";
		file_item.append(a);
		return file_item;
	}

	switch (file.TYPE.split("/")[0]) {
		case "image":
			let content = document.createElement("IMG") as HTMLImageElement;
			content.src = file.URL;
			file_item.appendChild(content);

			if (setting.message_nsfw_image_blur && file.NSFW) content.dataset["NSFW"] = "true";
			break;
		default:
			let a = document.createElement("A") as HTMLAnchorElement;
			a.href = file.URL;
			a.innerText = "添付ファイル";
			file_item.append(a);
			break;
	}

	return file_item;
}

export function gen_user_renkei(renkei:RenkeiAccount): HTMLElement {
	let el = document.createElement("DIV");
	el.className = "RENKEI_ITEM";

	let logo = document.createElement("IMG") as HTMLImageElement;
	logo.src = renkei.SERVICE_ICON;
	el.append(logo);

	let g = document.createElement("DIV");
	el.append(g);

	let service_name = document.createElement("DIV");
	service_name.innerText = renkei.SERVICE_NAME;
	g.append(service_name);

	let account_name = document.createElement("DIV");
	account_name.innerText = renkei.ACCOUNT_NAME;
	g.append(account_name);

	return el;
}