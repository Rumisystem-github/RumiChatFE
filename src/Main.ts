import { get_dm_list, get_group_list, get_setting, get_user, update_setting } from "./API";
import { compresser_init } from "./Compresser";
import { LOGIN_PAGE_URL } from "./const";
import { loading_end_progress, loading_message, loading_print_failed, loading_print_info, loading_print_progress, } from "./Loading";
import { PREFIX_FAILED, PREFIX_OK } from "./Log";
import { login } from "./Login";
import { page_detect } from "./Page/PageMain";
import { connect } from "./StreamingAPI";
import type { DM } from "./Type/DM";
import type { Group } from "./Type/Group";
import type { User } from "./Type/User";
import { refresh_dm_list, refresh_group_list } from "./UI";

export let token: string;
export let self_user: User;
export let join_group_list: Group[];
export let dm_list: DM[] = [];
export let watching = true;
export let setting = {
	promode: false
};

export let mel = {
	top: {
		group_list: document.getElementById("GROUP_LIST")!,
		self_user: {
			icon: document.getElementById("SELF_USER_ICON")! as HTMLImageElement
		}
	},
	side: {
		group_header: {
			parent: document.getElementById("GROUP_HEADER")!,
			title: document.getElementById("GROUP_HEADER_TITLE")!
		},
		room_list: document.getElementById("ROOM_LIST")!,
		dm_list: document.getElementById("DM_LIST")!
	},
	chat: {
		parent: document.getElementById("CHAT_ROOM")!,
		top: {
			title: document.getElementById("CHAT_ROOM_TITLE")!
		},
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
	},
	menu: {
		group: {
			parent: document.getElementById("GROUP_MENU")!,
			invite: document.getElementById("GROUP_MENU_INVITE")! as HTMLButtonElement,
			invite_list: document.getElementById("GROUP_MENU_INV_LIST")! as HTMLButtonElement,
		}
	},
	dialog: {
		group_invite_list: {
			parent: document.getElementById("GROUP_INVITE_LIST")!,
			table: document.getElementById("GROUP_INVITE_LIST_TABLE")! as HTMLTableElement
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
		//Zstd
		l = loading_print_progress("圧縮システムを初期化中...");
		loading_message("圧縮システムを初期化中...");
		await compresser_init();
		loading_end_progress(l, PREFIX_OK);

		//ログイン
		l = loading_print_progress("ｱｶｳﾝﾄｻｰﾊﾞｰへﾛｸﾞｲﾝ情報を検証中...");
		loading_message("ログインしています");
		const login_result = await login();
		if (!login_result.status) {
			window.location.href = LOGIN_PAGE_URL;
			return;
		}
		token = login_result.token!;
		self_user = login_result.user!;
		mel.top.self_user.icon.src = "https://account.rumiserver.com/api/Icon?ID=" + self_user.ID;
		loading_end_progress(l, PREFIX_OK);

		//グループ
		l = loading_print_progress("ｸﾞﾙｰﾌﾟ一覧を取得中...");
		loading_message("グループを取得しています");
		await reload_group_list();
		loading_end_progress(l, PREFIX_OK);

		//DM
		l = loading_print_progress("DM一覧を取得中...");
		loading_message("DMを取得しています");
		await reload_dm_list();
		await refresh_dm_list();
		loading_end_progress(l, PREFIX_OK);

		//設定
		l = loading_print_progress("設定を取得中...");
		loading_message("設定を同期しています");
		const server_setting = await get_setting();
		loading_end_progress(l, PREFIX_OK);
		//サーバーの設定でローカルの設定を上書きする
		for (const key of Object.keys(server_setting) as (keyof typeof server_setting)[]) {
			if (setting[key] == null) continue;
			setting[key] = server_setting[key];
		}
		loading_print_info("サーバー設定でローカル設定を上書きしました。");
		loading_print_info(JSON.stringify(setting));

		l = loading_print_progress("設定を同期中");
		await update_setting(setting);

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

export async function reload_group_list() {
	join_group_list = await get_group_list();
	refresh_group_list();
}

export async function reload_dm_list() {
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

/**
 * ポップアップを表示した際の後ろに出すアレを生成し、bodyに突っ込みます
 * @param bg 背景をまっくろにするか
 * @returns アレ
 */
export function show_dialog_bg(bg: boolean): HTMLDivElement {
	let el = document.createElement("DIV") as HTMLDivElement;
	el.className = "DIALOG_BG";
	if (bg) el.dataset["bg"] = "true";

	document.body.append(el);

	return el;
}

export async function copy(text: string) {
	await navigator.clipboard.writeText(text);
}