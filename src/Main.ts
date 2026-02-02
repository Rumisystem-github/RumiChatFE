import { create_dm, follow_user, get_dm_list, get_group_list, get_public_key, get_setting, get_user, get_user_raw, unfollow_user, update_setting } from "./API";
import { compresser_init } from "./Compresser";
import { LOGIN_PAGE_URL } from "./const";
import { import_key, is_imported, key_manager_init } from "./ImportKeyManager";
import { loading_end_progress, loading_message, loading_print_failed, loading_print_info, loading_print_progress, } from "./Loading";
import { PREFIX_FAILED, PREFIX_OK } from "./Log";
import { login } from "./Login";
import { page_detect } from "./Page/PageMain";
import { change_url, replace_element } from "./SPA";
import { connect } from "./StreamingAPI";
import type { DM } from "./Type/DM";
import type { Group } from "./Type/Group";
import type { LoadSelfPGPKey, SelfPGPKey } from "./Type/SelfPGPKeyType";
import type { User } from "./Type/User";
import { refresh_dm_list, refresh_group_list } from "./UI";
import { gen_user_renkei } from "./UIItem";
import * as openpgp from "openpgp";

export let token: string;
export let self_user: User;
export let join_group_list: Group[];
export let dm_list: DM[] = [];
export let watching = true;
export let setting = {
	promode: false,
	url_cleaner: true,
	message_input_preview: true,
	message_image_preview: true,
	message_nsfw_image_blur: true,
	message_video_volume_all_sync: true,
	message_video_volume_save: true
};
export let self_pgp_key: SelfPGPKey = {
	public_key: null,
	private_key: null
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
		dm_list: document.getElementById("DM_LIST")!,
		setting_list: document.getElementById("SETTING_LIST")!
	},
	contents: {
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
		setting: {
			parent: document.getElementById("SETTING")!,
			title: document.getElementById("SETTING_TITLE")!,
			description: document.getElementById("SETTING_DESCRIPTION")!,
			field: document.getElementById("SETTING_FIELD")!,
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
		},
		user_profile: {
			parent: document.getElementById("USER_PROFILE")!,
			header: document.getElementById("USER_PROFILE_HEADER")!,
			icon: document.getElementById("USER_PROFILE_ICON")! as HTMLImageElement,
			name: document.getElementById("USER_PROFILE_NAME")!,
			uid: document.getElementById("USER_PROFILE_UID")!,
			description: document.getElementById("USER_PROFILE_DESCRIPTION")!,
			renkei_list: document.getElementById("USER_PROFILE_RENKEI_LIST")!,
			dm: document.getElementById("USER_PROFILE_DM")! as HTMLButtonElement,
			follow: document.getElementById("USER_PROFILE_FOLLOW")! as HTMLButtonElement,
			key: document.getElementById("USER_PROFILE_KEY") as HTMLButtonElement
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
	loading_print_info(`るみチャット V${import.meta.env.APP_VERSION}`);
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
		for (const raw_key of Object.keys(server_setting)) {
			// @ts-ignore
			const key = raw_key.replace("rc_", "");
			// @ts-ignore
			if (setting[key] == null) continue;
			// @ts-ignore
			setting[key] = server_setting[raw_key];
		}
		loading_print_info("サーバー設定でローカル設定を上書きしました。");
		loading_print_info(JSON.stringify(setting));

		l = loading_print_progress("設定を同期中");
		let latest_setting = {};
		for (const key of Object.keys(setting)) {
			// @ts-ignore
			latest_setting["rc_" + key] = setting[key];
		}
		await update_setting(latest_setting);

		//WebSocket
		l = loading_print_progress("WebSocketへ接続中...");
		loading_message("サーバーへ接続しています");
		await connect();
		loading_end_progress(l, PREFIX_OK);

		//自分の鍵をインポート
		l = loading_print_progress("鍵を読み込んでいます...");
		loading_message("鍵をロード中");
		const self_key_json = localStorage.getItem("SELF_PGP_KEY");
		if (self_key_json != null){
			const self_key = JSON.parse(self_key_json) as LoadSelfPGPKey;

			//公開鍵をロード
			const public_key = await openpgp.readKey({armoredKey: self_key.PUBLIC});

			//秘密鍵をロード
			let private_key = await openpgp.readPrivateKey({armoredKey: self_key.PRIVATE});
			if (self_key.PASSPHRASE != null) {
				private_key = await openpgp.decryptKey({privateKey: await openpgp.readPrivateKey({armoredKey: self_key.PRIVATE}), passphrase: self_key.PASSPHRASE});
			}

			self_pgp_key.public_key = public_key;
			self_pgp_key.private_key = private_key;

			console.log(self_pgp_key.public_key.getFingerprint());
			console.log(self_pgp_key.private_key.getFingerprint());
		} else {
			try {
				await get_public_key(self_user.ID);
				//TODO:鍵のインポートダイアログ
			} catch {
				loading_print_info("鍵はありません。");
			}
		}
		loading_end_progress(l, PREFIX_OK);

		//他人のインポートした鍵をロード
		l = loading_print_progress("インポートした鍵を読み込んでいます...");
		await key_manager_init();
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

export async function open_user_profile(user_id: string) {
	const bg = show_dialog_bg(true);
	const raw = await get_user_raw(user_id);
	const user = raw.ACCOUNT;
	let followed = raw.FOLLOW;

	//アイコン
	mel.dialog.user_profile.icon.src = "https://account.rumiserver.com/api/Icon?ID=" + user_id;
	mel.dialog.user_profile.icon.className = `ICON_${user.ICON}`;

	//名前/UID
	mel.dialog.user_profile.name.innerText = user.NAME;
	mel.dialog.user_profile.uid.innerText = user.UID;

	//DMを開く
	mel.dialog.user_profile.dm.onclick = async function() {
		mel.dialog.user_profile.dm.setAttribute("disabled", "");
		const room_id = await create_dm(user.ID);
		mel.dialog.user_profile.dm.removeAttribute("disabled");

		change_url("/dm/" + room_id);
		
	};

	//フォローボタン
	if (user.ID !== self_user.ID) {
		mel.dialog.user_profile.follow.style.opacity = "1";
		if (followed) {
			mel.dialog.user_profile.follow.innerText = "フォロー解除";
		} else {
			if (raw.FOLLOWER) {
				mel.dialog.user_profile.follow.innerText = "フォローバック";
			} else {
				mel.dialog.user_profile.follow.innerText = "フォロー";
			}
		}

		mel.dialog.user_profile.follow.onclick = async function() {
			if (followed) {
				await unfollow_user(user.UID);

				followed = false;
				mel.dialog.user_profile.follow.innerText = "フォロー";
			} else {
				await follow_user(user.UID);

				followed = true;
				mel.dialog.user_profile.follow.innerText = "フォロー解除";
			}
		}
	} else {
		//自分自身なら隠すよ
		mel.dialog.user_profile.follow.style.opacity = "0";
	}

	//鍵交換
	if (user.ID !== self_user.ID && !is_imported(user.ID)) {
		mel.dialog.user_profile.key.style.opacity = "1";

		mel.dialog.user_profile.key.onclick = async function() {
			await import_key(user.ID);
			mel.dialog.user_profile.key.style.opacity = "0";
		}
	} else {
		mel.dialog.user_profile.key.style.opacity = "0";
	}

	//説明
	mel.dialog.user_profile.description.innerText = user.DESCRIPTION;

	let renkei_list: HTMLElement[] = [];
	for (const renkei of user.RENKEI) {
		renkei_list.push(gen_user_renkei(renkei));
	}
	replace_element(mel.dialog.user_profile.renkei_list, renkei_list);

	//閉じ
	mel.dialog.user_profile.parent.dataset["hide"] = "false";
	bg.onclick = function() {
		bg.remove();
		mel.dialog.user_profile.parent.dataset["hide"] = "true";
	}
}