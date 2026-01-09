import { get_message_list, update_last_read_message } from "../API";
import { mel, self_user, token } from "../Main";
import { set_receive_message_event } from "../StreamingAPI";
import type { SendMessageResponse } from "../Type/APIResponseType";
import { refresh_dm_list, refresh_room_list } from "../UI";
import { uiitem_message_item } from "../UIItem";

const UPLOAD_CHUNK_SIZE = 500 * 1024;
let message_list_scrolled_bottom = false;
let open_group_id: string | null;
let open_room_id:string;
let select_file_list:File[] = [];
let is_dm = false;

export async function start(group_id: string | null, room_id: string) {
	open_room_id = room_id;
	open_group_id = group_id;
	is_dm = (group_id == null);

	mel.chat.viewer.user.icon.classList.add("ICON_" + self_user.ICON);
	mel.chat.viewer.user.icon.src = "https://account.rumiserver.com/api/Icon?UID=" + self_user.UID;
	mel.chat.viewer.user.name.innerText = self_user.NAME;

	mel.chat.top.title.innerText = "//TODO:部屋名を取得する";

	//ううううううう
	refresh_file_list();

	//DMか
	if (is_dm) {
		//DMリスト
		await refresh_dm_list();
		mel.side.dm_list.style.display = "block";
	} else {
		//部屋一覧
		await refresh_room_list(group_id!);
		mel.side.room_list.style.display = "block";
	}

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

	await update_last_read_message(room_id);

	//一番下までスクロール
	mel.chat.message_list.scrollTop = mel.chat.message_list.scrollHeight;
	message_list_scrolled_bottom = true;

	set_receive_message_event(async (e)=>{
		if (open_room_id === e.ROOM_ID) {
			const bottom = message_list_scrolled_bottom;
			mel.chat.message_list.append(await uiitem_message_item(e.USER, e.MESSAGE));

			await update_last_read_message(e.ROOM_ID);

			if (bottom) {
				//レイアウト確定を待つ
				await new Promise(requestAnimationFrame);
				mel.chat.message_list.scrollTop = mel.chat.message_list.scrollHeight;
			}
		} else {
			if (is_dm == false && open_group_id == e.GROUP_ID) {
				console.log("ひらいているグループの話だ");
			}
		}
	});
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

//入力欄への入力イベント
mel.chat.form.text.addEventListener("keyup", refresh_viewer);

async function refresh_viewer() {
	const bottom = message_list_scrolled_bottom;
	const text = mel.chat.form.text.value.trim();

	if (text.length !== 0) {
		mel.chat.viewer.text.innerText = text;
		mel.chat.viewer.parent.dataset["hide"] = "false";

		//アニメーションが終わって、且つさっきまで一番下までスクロールしてたなら、一番下までもっかいスクロールする
		mel.chat.viewer.parent.addEventListener("transitionend", ()=>{
			if (bottom) {
				mel.chat.message_list.scrollTop = mel.chat.message_list.scrollHeight;
			}
		}, {once: true});
	} else {
		//mel.chat.viewer.parent.replaceChildren();
		mel.chat.viewer.parent.dataset["hide"] = "true";
	}
}

async function refresh_file_list() {
	mel.chat.form.file_list.replaceChildren();

	if (select_file_list.length === 0) {
		mel.chat.form.file_list.style.display = "none";
		return;
	} else {
		mel.chat.form.file_list.style.display = "block";
	}

	for (let i = 0; i < select_file_list.length; i++) {
		const file = select_file_list[i];
		const blob = URL.createObjectURL(file);

		let file_item = document.createElement("DIV");
		file_item.className = "FILE_ITEM";
		file_item.dataset["type"] = "UPLOADING";
		file_item.dataset["index"] = i.toString();

		let delete_button = document.createElement("BUTTON");
		delete_button.innerText = "X";
		file_item.append(delete_button);
		delete_button.onclick = function() {
			refresh_file_list();
		};

		let content = document.createElement("IMG") as HTMLImageElement;
		content.src = blob;
		file_item.appendChild(content);

		let progress_bar = document.createElement("PROGRESS") as HTMLProgressElement;
		progress_bar.max = 100;
		file_item.append(progress_bar);

		mel.chat.form.file_list.appendChild(file_item);

		URL.revokeObjectURL(blob);
	}
}

//送信
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

	type file_queue_type = {
		TYPE: string,
		NSFW: boolean
	};

	let file_list:file_queue_type[] = [];
	for (let i = 0; i < select_file_list.length; i++) {
		file_list.push(
			{
				TYPE: select_file_list[i].type,
				NSFW: false
			}
		);
	}

	let ajax = await fetch("/api/Message", {
		method: "POST",
		headers: {
			"TOKEN": token,
			"Content-Type": "application/json; charset=UTF-8",
			"Accept": "application/json"
		},
		body: JSON.stringify({
			"ROOM_ID": open_room_id,
			"TEXT": text,
			"FILE": file_list
		})
	});
	const result = await ajax.json() as SendMessageResponse;
	if (result.STATUS == false) {
		alert("エラー");
	}

	if (select_file_list.length !== 0 && result.FILE != null) {
		for (let i = 0; i < select_file_list.length; i++) {
			const file = select_file_list[i];
			const queue_id = result.FILE[i];
			const total_size = file.size;
			let end = 0;
			const stream = file.stream();
			const reader = stream.getReader();
			let buffer = new Uint8Array(0);

			while (true) {
				const {done, value} = await reader.read();
				if (done) break;

				//前回の余りと結合
				const merged = new Uint8Array(buffer.length + value.length);
				merged.set(buffer, 0);
				merged.set(value, buffer.length);
				buffer = merged;

				//500KBずつ送信
				while (buffer.length >= UPLOAD_CHUNK_SIZE) {
					const chunk = buffer.slice(0, UPLOAD_CHUNK_SIZE);
					buffer = buffer.slice(UPLOAD_CHUNK_SIZE);
					await upload(queue_id, chunk);
					end += chunk.length;
					update_file_progress(i, (end / total_size) * 100);
				}
			}

			//残りを送信
			if (buffer.length > 0) {
				await upload(queue_id, buffer);
				end += buffer.length;
				update_file_progress(i, (end / total_size) * 100);
			}

			await uplaod_end(queue_id);
		}
	}

	//初期化
	mel.chat.form.text.value = "";
	select_file_list.splice(0);
	mel.chat.form.menu.button.removeAttribute("disabled");
	mel.chat.form.send.removeAttribute("disabled");
	mel.chat.viewer.parent.dataset["hide"] = "true";

	refresh_file_list();
}

function update_file_progress(index:number, progress:number) {
	let file_item = document.querySelector(`.FILE_ITEM[data-type="UPLOADING"][data-index="${index.toString()}"]`);
	if (file_item == null) return;
	let progress_bar = file_item.querySelector("PROGRESS") as HTMLProgressElement;
	if (progress_bar == null) return;

	progress_bar.value = progress;
}

async function upload(queue_id: string, chunk: Uint8Array<ArrayBuffer>): Promise<boolean> {
	let ajax = await fetch("/api/Message/File?QUEUE_ID="+queue_id, {
		method: "POST",
		headers: {
			"TOKEN": token,
			"Accept": "application/json"
		},
		body: chunk
	});
	const result = await ajax.json();
	if (result["STATUS"]) {
		return true;
	} else {
		return false;
	}
}

async function uplaod_end(queue_id: string): Promise<boolean> {
	let ajax = await fetch("/api/Message/File?QUEUE_ID="+queue_id, {
		method: "PATCH",
		headers: {
			"TOKEN": token,
			"Accept": "application/json"
		}
	});
	const result = await ajax.json();
	if (result["STATUS"]) {
		return true;
	} else {
		return false;
	}
}

//メニューの開く閉じる
mel.chat.form.menu.button.addEventListener("click", ()=>{
	if (mel.chat.form.menu.menu.dataset["hide"] === "true") {
		mel.chat.form.menu.menu.dataset["hide"] = "false"
	} else {
		mel.chat.form.menu.menu.dataset["hide"] = "true"
	}
});

//ファイル選択
mel.chat.form.menu.contents.file.addEventListener("click", ()=>{
	let dialog = document.createElement("INPUT") as HTMLInputElement;
	dialog.type = "file";
	dialog.click();

	dialog.onchange = function() {
		const file_list = dialog.files!;
		for (let i = 0; i < file_list.length; i++) {
			select_file_list.push(file_list[i]);
		}

		mel.chat.form.menu.menu.dataset["hide"] = "true"
		refresh_file_list();
	}
});

mel.chat.form.text.addEventListener("paste", (e)=>{
	if (e.clipboardData == null) return;

	for (const file of e.clipboardData.files) {
		select_file_list.push(file);
	}

	refresh_file_list();
});