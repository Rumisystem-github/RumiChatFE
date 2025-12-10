import { get_message_list } from "../API";
import { mel, self_user, token } from "../Main";
import type { SendMessageResponse } from "../Type/APIResponseType";
import type { Message } from "../Type/Message";
import { refresh_room_list } from "../UI";
import { uiitem_message_item } from "../UIItem";

let message_list_scrolled_bottom = false;
let open_room_id:string;

export async function start(group_id: string, room_id: string) {
	open_room_id = room_id;

	//部屋一覧
	await refresh_room_list(group_id);
	mel.side.room_list.style.display = "block";

	//メッセージ一覧を消し飛ばす
	mel.chat.message_list.replaceChildren();

	//メッセージを入れる
	const message_list = await get_message_list(room_id);
	for (let i = 0; i < message_list.length; i++) {
		mel.chat.message_list.prepend(await uiitem_message_item(message_list[i].ACCOUNT, message_list[i].MESSAGE));
	}

	//チャットルームを表示
	mel.chat.parent.style.display = "flex";

	//レイアウト確定を待つ
	await new Promise(requestAnimationFrame);

	//一番下までスクロール
	mel.chat.message_list.scrollTop = mel.chat.message_list.scrollHeight;
	message_list_scrolled_bottom = true;
}

//メッセージ一覧スクロール
mel.chat.message_list.addEventListener("scroll", () => {
	//一番上(から100px)
	if (mel.chat.message_list.scrollTop <= 100) {
		console.log("一番上から100px");
		return;
	}

	//一番下
	if (mel.chat.message_list.scrollTop + mel.chat.message_list.clientHeight >= mel.chat.message_list.scrollHeight) {
		message_list_scrolled_bottom = true;
		return;
	} else {
		message_list_scrolled_bottom = false;
	}
});

mel.chat.form.text.addEventListener("keyup", async () => {
	const bottom = message_list_scrolled_bottom;

	if (mel.chat.form.text.value.trim().length !== 0) {
		mel.chat.viewer.parent.replaceChildren();
		mel.chat.viewer.parent.append(await uiitem_message_item(self_user, {
			ID: "",
			CREATE_AT: new Date().toISOString(),
			TEXT: mel.chat.form.text.value.trim(),
			FILE_LIST: []
		} as Message));

		mel.chat.viewer.parent.dataset["hide"] = "false";

		//アニメーションが終わって、且つさっきまで一番下までスクロールしてたなら、一番下までもっかいスクロールする
		mel.chat.viewer.parent.addEventListener("transitionend", ()=>{
			if (bottom) {
				mel.chat.message_list.scrollTop = mel.chat.message_list.scrollHeight;
			}
		}, {once: true});
	} else {
		mel.chat.viewer.parent.replaceChildren();
		mel.chat.viewer.parent.dataset["hide"] = "true";
	}
});

mel.chat.form.text.addEventListener("keypress", (e)=>{
	if (e.key == "Enter" && !e.ctrlKey) {
		e.preventDefault();
		send();
	}
});
mel.chat.form.send.addEventListener("click", send);

async function send() {
	const text = mel.chat.form.text.value;
	if (text.trim().length === 0) return;

	//ロック
	mel.chat.form.menu.button.setAttribute("disabled", "");
	mel.chat.form.send.setAttribute("disabled", "");

	let ajax = await fetch("/api/Message", {
		method: "POST",
		headers: {
			"TOKEN": token
		},
		body: JSON.stringify({
			"ROOM_ID": open_room_id,
			"TEXT": text
		})
	});
	const result = await ajax.json() as SendMessageResponse;
	if (result.STATUS == false) {
		alert("エラー");
	}

	//初期化
	mel.chat.form.text.value = "";
	mel.chat.form.menu.button.removeAttribute("disabled");
	mel.chat.form.send.removeAttribute("disabled");
	mel.chat.viewer.parent.replaceChildren();
	mel.chat.viewer.parent.dataset["hide"] = "true";
}