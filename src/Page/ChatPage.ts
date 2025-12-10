import { get_message_list } from "../API";
import { mel } from "../Main";
import { refresh_room_list } from "../UI";
import { uiitem_message_item } from "../UIItem";

export async function start(group_id: string, room_id: string) {
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
}

mel.chat.message_list.addEventListener("scroll", ()=>{
	//一番上(から100px)
	if (mel.chat.message_list.scrollTop <= 100) {
		console.log("一番上から100px");
		return;
	}

	//一番下
	if (mel.chat.message_list.scrollTop + mel.chat.message_list.clientHeight >= mel.chat.message_list.scrollHeight) {
		console.log("一番下だ");
		return;
	}
});

