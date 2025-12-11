import { get_group_list } from "./API";
import { page_detect } from "./Page/PageMain";
import type { SessionLoginResponse } from "./Type/APIResponseType";
import type { Group } from "./Type/Group";
import type { User } from "./Type/User";
import { refresh_group_list } from "./UI";

const login_page = "https://account.rumiserver.com/Login/";

export let token: string;
export let self_user: User;
export let join_group_list: Group[];
export let mel = {
	top: {
		group_list: document.getElementById("GROUP_LIST")!
	},
	side: {
		room_list: document.getElementById("ROOM_LIST")!
	},
	chat: {
		parent: document.getElementById("CHAT_ROOM")!,
		message_list: document.getElementById("MESSAGE_LIST")!,
		viewer: {
			parent: document.getElementById("MESSAGE_VIEW")!,
			user: {
				icon: document.getElementById("MESSAGE_VIEW_USER_ICON")! as HTMLImageElement,
				name: document.getElementById("MESSAGE_VIEW_USER_NAME")!
			},
			text: document.getElementById("MESSAGE_VIEW_TEXT")!
		},
		form: {
			menu: {
				button: document.getElementById("MESSAGE_FORM_MENU_BUTTON")!,
				menu: document.getElementById("MESSAGE_FORM_MENU")!,
				contents: {
					file: document.getElementById("MESSAGE_FORM_MENU_FILE_BUTTON")!
				}
			},
			text: document.getElementById("MESSAGE_FORM_TEXT")! as HTMLTextAreaElement,
			send: document.getElementById("MESSAGE_FORM_SEND")!,
			file_list: document.getElementById("MESSAGE_FORM_FILE_LIST")!
		}
	}
};

window.addEventListener("load", main);

async function main() {
	await login();

	join_group_list = await get_group_list();
	refresh_group_list();

	page_detect();
}

async function login() {
	document.cookie.split(";").forEach(row => {
		if (row.startsWith("SESSION=")) {
			token = row.substring(row.indexOf("=") + 1);
		}
	});

	if (token == null) {
		window.location.href = login_page;
		return;
	}

	let ajax = await fetch(`https://account.rumiserver.com/api/Session?ID=${token}`);
	const result = (await ajax.json()) as SessionLoginResponse;

	if (!result.STATUS) {
		window.location.href = login_page;
		return;
	}

	self_user = result.ACCOUNT_DATA;
}
