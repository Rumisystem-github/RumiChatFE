import { get_dm_list, get_group_list, get_user } from "./API";
import { compresser_init } from "./Compresser";
import { loading_end_progress, loading_message, loading_print_failed, loading_print_info, loading_print_progress, PREFIX_FAILED, PREFIX_OK } from "./Loading";
import { page_detect } from "./Page/PageMain";
import { connect } from "./StreamingAPI";
import type { SessionLoginResponse } from "./Type/APIResponseType";
import type { DM } from "./Type/DM";
import type { Group } from "./Type/Group";
import type { User } from "./Type/User";
import { refresh_dm_list, refresh_group_list } from "./UI";

const login_page = "https://account.rumiserver.com/Login/";

export let token: string;
export let self_user: User;
export let join_group_list: Group[];
export let dm_list: DM[] = [];
export let watching = true;

export let mel = {
	top: {
		group_list: document.getElementById("GROUP_LIST")!
	},
	side: {
		room_list: document.getElementById("ROOM_LIST")!,
		dm_list: document.getElementById("DM_LIST")!
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

document.addEventListener("visibilitychange", ()=>{
	if (document.visibilityState === "hidden") {
		watching = false;
	} else {
		watching = true;
	}
});

window.addEventListener("blur", ()=>{
	watching = false;
});

window.addEventListener("focus", ()=>{
	watching = true;
});

async function main() {
	loading_print_info("るみチャット V0.0.0");
	loading_print_info("©合同会社るみしすてむ 2026");

	let l = "";

	try {
		l = loading_print_progress("圧縮システムを初期化中...");
		loading_message("圧縮システムを初期化中...");
		await compresser_init();
		loading_end_progress(l, PREFIX_OK);

		l = loading_print_progress("ｱｶｳﾝﾄｻｰﾊﾞｰへﾛｸﾞｲﾝ情報を検証中...");
		loading_message("ログインしています");
		await login();
		loading_end_progress(l, PREFIX_OK);

		l = loading_print_progress("ｸﾞﾙｰﾌﾟ一覧を取得中...");
		loading_message("グループを取得しています");
		join_group_list = await get_group_list();
		refresh_group_list();
		loading_end_progress(l, PREFIX_OK);

		l = loading_print_progress("DM一覧を取得中...");
		loading_message("DMを取得しています");
		await reload_dm_list();
		await refresh_dm_list();
		loading_end_progress(l, PREFIX_OK);

		//WebSocket
		l = loading_print_progress("WebSocketへ接続中...");
		loading_message("サーバーへ接続しています");
		await connect();
		loading_end_progress(l, PREFIX_OK);

		page_detect();
		loading_message("よーこそ");
		document.getElementById("LOADING")?.remove();
	} catch (ex) {
		loading_end_progress(l, PREFIX_FAILED);
		loading_print_failed(ex as string);
		loading_message("ｼｽﾃﾑｴﾗｰ！");
	}
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

async function reload_dm_list() {
	const dm_room_list = await get_dm_list();

	for (const room of dm_room_list) {
		let user = await get_user(room.NAME);

		dm_list.push(
			{
				room: room,
				user: user
			}
		);
	}
}