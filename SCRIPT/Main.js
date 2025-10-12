const ACCOUNT_API = "https://account.rumiserver.com/api/";
const LOGIN_PAGE = "https://account.rumiserver.com/Login?rd=rumichat";

let SESSION = null;
let ACCOUNT_DATA = null;
let dialog = new DIALOG_SYSTEM();
let rspa = new RSPA();
let DMList = [];
let OpenGroupID = null;								//今開いているグループのID
let OpenRoomID = null;								//今開いている部屋のID
let OpenGroup = null;								//今開いているグループ
let OpenRoom = null;								//今開いている部屋
let LastOpenRoomID = {};							//最後に開いたチャット部屋
let ChatMessageListScrollBottom = false;			//←チャットのメッセージ一覧が一番下までスクロールされているフラグ
let ChatMessagePage = {};
let ChatMessageLoading = false;
let SelectFileList = [];
let setting = {
	rc_enter_send: true,
	rc_url_cleaner: true,
	pro_mode: false
};
let EL = {
	SELF: {
		ICON: document.getElementById("SELF_ICON")
	},
	GROUPLIST: document.getElementById("GROUPLIST"),
	SIDEMENU: {
		GROUP_TOOLBAR: document.getElementById("GROUP_TOOLBAR"),
		GROUP_ROOM: document.getElementById("GROUP_ROOM"),
		GROUP_NAME: document.getElementById("GROUP_NAME"),
		ROOMLIST: document.getElementById("ROOMLIST"),
		DM: document.getElementById("DM"),
		DMLIST: document.getElementById("DMLIST"),
		GROUP_MENU: {
			BG: document.getElementById("GROUP_MENU_BG"),
			MAIN: document.getElementById("GROUP_MENU")
		}
	},
	CONTENTS: {
		DISPLAY: document.getElementById("DISPLAY"),
		GROUP_INFO: document.getElementById("GROUP_INFO"),
		DM: document.getElementById("DM_DISPLAY"),
		CHATROOM: document.getElementById("CHATROOM"),
		MESSAGELIST: document.getElementById("MESSAGELIST"),
		EXTEND: {
			MENU: document.getElementById("SEND_MENU"),
			FILE_LIST: document.getElementById("SEND_FILE_LIST")
		},
		CHATINPUT: document.getElementById("CHATINPUT"),
		FILE_SELECT: document.getElementById("FILE_SELECT"),
		SEND_BUTTON: document.getElementById("MESSAGE_SEND_BUTTON"),
		HOME: {
			CREATE_DM: {
				UID: document.getElementById("CREATE_DM_UID"),
				LIST: document.getElementById("CREATE_DM_LIST")
			}
		}
	},
	FILE_VIWER: {
		BG: document.getElementById("FILE_VIEWER_BG"),
		VIEWER: document.getElementById("FILE_VIEWER")
	},
	SETTING: {
		BG: document.getElementById("SETTING_DIALOG_BG"),
		DIALOG: document.getElementById("SETTING_DIALOG"),
		CONTENTS: {
			CHAT: {
				CTRL_SEND: document.getElementById("SETTING_CTRL_SEND"),
				URLCLEANER: document.getElementById("SETTING_URLC")
			}
		}
	}
};

//読込完了
window.addEventListener("load", (E) => {
	main();
});

window.addEventListener("resize", (e) => {
	//スクロール変形した時に、下から100px以内なら、一番下にスクロール
	if (EL.CONTENTS.MESSAGELIST.scrollTop + EL.CONTENTS.MESSAGELIST.clientHeight >= EL.CONTENTS.MESSAGELIST.scrollHeight - 100) {
		MessageListBottomScroll();
	}
});

//チャットのメッセージ一覧のスクロール位置が一番下であることを取得する
EL.CONTENTS.MESSAGELIST.addEventListener("scroll", async (e) => {
	ChatMessageListScrollBottom = EL.CONTENTS.MESSAGELIST.scrollTop + EL.CONTENTS.MESSAGELIST.clientHeight >= EL.CONTENTS.MESSAGELIST.scrollHeight;

	if (EL.CONTENTS.MESSAGELIST.scrollTop <= EL.CONTENTS.MESSAGELIST.clientHeight / 4 && !ChatMessageLoading) {
		ChatMessageLoading = true;

		const MessageList = await GetMessageList(OpenRoomID, ChatMessagePage[OpenRoomID] + 1);
		if (MessageList.length != 0) {
			ChatMessagePage[OpenRoomID] += 1;
		}

		//ページネーション
		const PrevScrollHeight = EL.CONTENTS.MESSAGELIST.scrollHeight;
		for (let I = 0; I < MessageList.length; I++) {
			const ROW = MessageList[I];
			EL.CONTENTS.MESSAGELIST.prepend(await GenMessageItem(ROW.MESSAGE, ROW.USER));

			EL.CONTENTS.MESSAGELIST.scrollTop = EL.CONTENTS.MESSAGELIST.scrollHeight - PrevScrollHeight;
		}

		//読み込み完了
		ChatMessageLoading = false;
	}
});

async function main() {
	let L = null;
	try {
		SESSION = ReadCOOKIE().SESSION;
		if (SESSION !== null) {
			L = LOAD_WAIT_PRINT("ログイン");

			//ログインする
			ACCOUNT_DATA = await LOGIN(SESSION);
			if (ACCOUNT_DATA !== false) {
				LOAD_WAIT_STOP(L, "OK");

				//色々セット
				EL.SELF.ICON.src = ACCOUNT_API + "Icon?ID=" + ACCOUNT_DATA.ID;
			} else {
				LOAD_WAIT_STOP(L, "FAILED");
				window.location.href = LOGIN_PAGE;
				return;
			}
		}

		//開いていた部屋情報を復元
		if (ReadCOOKIE().LAST_OPEN_ROOM != null) {
			LastOpenRoomID = JSON.parse(decodeURIComponent(ReadCOOKIE().LAST_OPEN_ROOM));
		}

		//るみチャットを利用しているか
		if (!await GetUseSERVICE()) {
			document.getElementById("WELCOME").style.display = "block";
			CLOSE_LOAD();
			return;
		}

		//グループ一覧を初期化
		L = LOAD_WAIT_PRINT("グループ一覧を初期化中");
		await RefreshGroupList();
		LOAD_WAIT_STOP(L, "OK");

		//DM一覧を初期化
		L = LOAD_WAIT_PRINT("DM一覧を初期化中");
		DMList = await GetDMList();
		LOAD_WAIT_STOP(L, "OK");

		//設定をロード
		L = LOAD_WAIT_PRINT("設定を読み込んでいます");
		let server_setting = await GetSetting();
		const setting_key_list = Object.keys(server_setting);
		for (let i = 0; i < setting_key_list.length; i++) {
			const key = setting_key_list[i];
			setting[key] = server_setting[key];
		}
		LOAD_WAIT_STOP(L, "OK");

		//設定を同期
		L = LOAD_WAIT_PRINT("設定を同期しています");
		await RegistSetting(setting);
		LOAD_WAIT_STOP(L, "OK");

		//プロモード
		if (setting["pro_mode"] == false) {
			const promode_el = document.querySelectorAll("[data-promode=\"true\"]");
			for (let i = 0; i < promode_el.length; i++) {
				const element = promode_el[i];
				element.style.display = "none";
			}
		}

		//鍵をロード
		L = LOAD_WAIT_PRINT("鍵を読み込んでいます");
		await LoadPGPKey();
		LOAD_WAIT_STOP(L, "OK");

		//SPAの設定
		rspa.SETTING({
			BASE_URL: "",
			CONTENTS_EL: EL.CONTENTS.DISPLAY
		});

		//イベント設定
		rspa.addEventListener("pagechange", (E) => {
			if (!E.PAGE_EXISTS && !E.ENDPOINT_EXISTS) {
				console.log("404");
				//ページなし
			}
		});

		rspa.SET_ENTPOINT("/chat/*/*", PageRoom, true);
		rspa.SET_ENTPOINT("/chat/*", PageGroup, true);
		rspa.SET_ENTPOINT("/invite/*", PageInvite, true);
		rspa.SET_ENTPOINT("/dm/*", PageDM, true);
		rspa.SET_ENTPOINT("/", PageHome, true);

		L = LOAD_WAIT_PRINT("ストリーミングAPIに接続しています");
		await ConnectStreamingAPI();
		LOAD_WAIT_STOP(L, "OK");

		//ロード完了
		rspa.LOAD_OK();
		CLOSE_LOAD();
	} catch (EX) {
		console.error(EX);
		LOAD_WAIT_STOP(L, "FAILED");
	}
}

async function StartUse() {
	await SetUseSERVICE();
	window.location.reload();
}

async function RefreshGroupList() {
	const GroupList = await GetGroupList();

	EL.GROUPLIST.innerHTML = `<A HREF="/"><DIV CLASS="GROUPITEM">ホーム</DIV></A>`;

	for (let I = 0; I < GroupList.length; I++) {
		const Group = GroupList[I];
		let ACK = await GetGuildACK(Group.ID);

		EL.GROUPLIST.appendChild(GenGroupItem(Group, ACK));
	}
}

async function RefreshRoomList(ID) {
	const RoomList = await GetRoomList(ID);
	const ACKList = await GetACKList(ID);

	EL.SIDEMENU.ROOMLIST.innerHTML = "";

	for (let I = 0; I < RoomList.length; I++) {
		const Room = RoomList[I];

		EL.SIDEMENU.ROOMLIST.appendChild(GenRoomItem(Room, ACKList[Room.ID]));
	}
}

async function RefreshDMList() {
	DMList = await GetDMList();

	EL.SIDEMENU.DMLIST.innerHTML = "";
	for (let I = 0; I < DMList.length; I++) {
		const DM = DMList[I];

		EL.SIDEMENU.DMLIST.appendChild(GenDMItem(DM));
	}

	DMShow();
}

EL.CONTENTS.CHATINPUT.addEventListener("keydown", (e) => {
	if (setting["rc_enter_send"]) {
		//Enter送信(Shiftキー押しでキャンセル)
		if (e.shiftKey == false && e.key == "Enter") {
			e.preventDefault();
			SendMessageButton(e.target);
		}
	} else {
		//Ctrl + Enter 送信
		if (e.ctrlKey && e.key == "Enter") {
			e.preventDefault();
			SendMessageButton(e.target);
		}
	}
});

EL.CONTENTS.CHATINPUT.addEventListener("paste", async (e) => {
	const ItemList = e.clipboardData.items;

	for (let I = 0; I < ItemList.length; I++) {
		const Item = ItemList[I];
		if (Item.kind === "file") {
			const File = Item.getAsFile();

			SelectFileList.push(File);
			await UpdateSendFileList();
		}
	}
});

async function SendMessageButton(E) {
	if (E.value.length <= 0 && SelectFileList.length == 0) return;
	let PublicKey = null;
	let Text = E.value;

	//送信
	ChatInputFieldDisable(true);

	//URLクリーナー
	if (setting["rc_url_cleaner"]) {
		const regex = /\bhttps?:\/\/[^\s]+/g;
		const mtc = Text.match(regex);
		if (mtc != null) {
			for (let i = 0; i < mtc.length; i++) {
				const url = mtc[i];
				let ajax = await fetch("https://urlclean.rumiserver.com/api/Cleaner", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						"URL": url
					})
				});
				let result = await ajax.json();
				Text = Text.replace(url, result.URL);
			}
		}
	}

	const DM = DMList.find(Row => Row.ID == OpenRoomID);
	if (DM != null) {
		let EncryptFlag = true;
		let ImportedPGPKeyTable = JSON.parse(localStorage.getItem(LocalStragePGPImportItemKey));
		if (ImportedPGPKeyTable[DM.UID] == null) EncryptFlag = false;
		if (SelfPGPKey.Public == null) EncryptFlag = false;
		if (EncryptFlag) {
			PublicKey = await openpgp.readKey({ armoredKey: ImportedPGPKeyTable[DM.UID].PUBLICKEY[0] });
			Text = await EncryptText(Text, PublicKey);
		}

		const Parent = EL.SIDEMENU.DMLIST;
		const Target = EL.SIDEMENU.DMLIST.querySelector(`.ROOMITEM[data-uid="${DM.UID}"]`);
		Parent.insertBefore(Target, Parent.firstChild);
	}

	try {
		if (SelectFileList.length == 0) {
			await SendMessage(OpenRoomID, Text);
		} else {
			let FileList = [];
			for (let I = 0; I < SelectFileList.length; I++) {
				const Row = SelectFileList[I];
				FileList.push({
					TYPE: Row.type,
					SIZE: Row.size
				});
			}

			const ChunkSize = 1048576;//1MB
			const SendMessageResult = await SendFileMessage(OpenRoomID, Text, FileList);

			for (let I = 0; I < SelectFileList.length; I++) {
				const F = SelectFileList[I];
				const ID = SendMessageResult[I];

				if (PublicKey == null) {
					//暗号化無し
					const TotalChunkLength = Math.ceil(F.size / ChunkSize);
					for (let J = 0; J < TotalChunkLength; J++) {
						const Start = J * ChunkSize;
						const End = Math.min(F.size, Start + ChunkSize);
						const Chunk = F.slice(Start, End);

						await UpoadFile(ID, Chunk);
					}
				} else {
					//暗号化
					const FileBuffer = await F.arrayBuffer();
					const Encrypted = await EncryptUint8Array(new Uint8Array(FileBuffer), PublicKey);
					const EncryptBlob = new Blob([Encrypted], {type: "application/pgp-encrypted"});

					const TotalChunkLength = Math.ceil(EncryptBlob.size / ChunkSize);
					for (let J = 0; J < TotalChunkLength; J++) {
						const Start = J * ChunkSize;
						const End = Math.min(EncryptBlob.size, Start + ChunkSize);
						const Chunk = EncryptBlob.slice(Start, End);

						await UpoadFile(ID, Chunk);
					}
				}

				await UpoadFinalize(ID);
			}

			SelectFileList = [];
			await UpdateSendFileList();
		}
	} catch (EX) {
		console.log(EX);
		dialog.DIALOG("エラー");
	}

	//完了
	ChatInputFieldDisable(false);
	E.value = "";
}

function ChatInputFieldDisable(Mode) {
	if (Mode) {
		EL.CONTENTS.CHATINPUT.querySelector("textarea").setAttribute("disabled", "");
		EL.CONTENTS.CHATINPUT.querySelectorAll("button").forEach((ROW) => {
			ROW.setAttribute("disabled", "");
		});
	} else {
		EL.CONTENTS.CHATINPUT.querySelector("textarea").removeAttribute("disabled");
		EL.CONTENTS.CHATINPUT.querySelectorAll("button").forEach((ROW) => {
			ROW.removeAttribute("disabled");
		});

		EL.CONTENTS.CHATINPUT.querySelector("textarea").focus();
	}
}

function MessageListBottomScroll() {
	EL.CONTENTS.MESSAGELIST.scrollTop = EL.CONTENTS.MESSAGELIST.scrollHeight;
}

async function ClickNewRoomButton() {
	//グループを開いて無ければ何もしない
	if (OpenGroupID == null) {
		return;
	}

	const RoomName = await dialog.INPUT("部屋の作成", { TYPE: "TEXT", NAME: "部屋の名前" })
	if (RoomName != null) {
		const L = dialog.SHOW_LOAD();
		await CreateRoom(OpenGroupID, RoomName);
		await RefreshRoomList(OpenGroupID);
		dialog.CLOSE_LOAD(L);
	}
}

async function ClickNewGroupButton() {
	const GroupName = await dialog.INPUT("グループの作成", { TYPE: "TEXT", NAME: "グループの名前" })
	if (GroupName != null) {
		const L = dialog.SHOW_LOAD();
		await CreateGroup(GroupName);
		await RefreshGroupList();
		dialog.CLOSE_LOAD(L);
	}
}

function ClickGroupItem(GID) {
	if (LastOpenRoomID[GID] == null) {
		rspa.OPEN_URI(`/chat/${GID}`);
	} else {
		rspa.OPEN_URI(`/chat/${GID}/${LastOpenRoomID[GID]}`);
	}
}

function GroupRoomListShow() {
	EL.SIDEMENU.GROUP_ROOM.style.display = "block";

	//グループの名前とか
	EL.SIDEMENU.GROUP_NAME.innerHTML = htmlspecialchars(OpenGroup.NAME);
}

function DMShow() {
	EL.SIDEMENU.DM.style.display = "block";
}

function DMClose() {
	EL.SIDEMENU.DM.style.display = "none";
}

function GroupRoomListClose() {
	EL.SIDEMENU.GROUP_ROOM.style.display = "none";
}

async function ChatShow() {
	EL.CONTENTS.SEND_BUTTON.innerHTML = "<IMG SRC=\"/Asset/MdiSend.svg\">";
	EL.CONTENTS.CHATROOM.style.display = "block";

	//DM&相手宛が暗号化済み
	const DMUID = DMList.find(Row => Row.ID == OpenRoomID);
	if (DMUID != null) {
		let ImportedPGPKeyTable = JSON.parse(localStorage.getItem(LocalStragePGPImportItemKey));
		if (ImportedPGPKeyTable == null) return;
		if (ImportedPGPKeyTable[DMUID.UID] == null) return;

		//自分の鍵がある
		if (SelfPGPKey.Private != null) {
			EL.CONTENTS.SEND_BUTTON.innerHTML = "<IMG SRC=\"/Asset/MdiSecurity.svg\">";
		}
	}
}

function ChatClose() {
	EL.CONTENTS.CHATROOM.style.display = "none";
}

function GroupInfoShow() {
	EL.CONTENTS.GROUP_INFO.style.display = "block";
	EL.CONTENTS.GROUP_INFO.innerText = OpenGroup.NAME;
}

function GroupInfoClose() {
	EL.CONTENTS.GROUP_INFO.style.display = "none";
}

function OpenGroupMenu() {
	EL.SIDEMENU.GROUP_MENU.BG.style.display = "block";
	EL.SIDEMENU.GROUP_MENU.MAIN.style.display = "block";
}

function CloseGroupMenu() {
	EL.SIDEMENU.GROUP_MENU.BG.style.display = "none";
	EL.SIDEMENU.GROUP_MENU.MAIN.style.display = "none";
}

function show_menu() {
	const id = crypto.randomUUID();

	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const width = Math.floor(vw / 2);
	const height = Math.floor(vh / 2);
	const menu_id = dialog.OPEN_MENU((vw - width) / 2, (vh - height) / 2, `<DIV ID="${id}" STYLE="width: ${width}px; height: ${height}px; background-color: white; padding: 10px;"></DIV>`);
	document.getElementById(`MENU_BACKGROUND_${menu_id}`).style.backgroundColor = "var(--DIALOG_BG_COLOR)";

	return document.getElementById(id);
}

async function ShowInviteView() {
	const InviteList = await GetInviteList(OpenGroupID);

	let menu_el = show_menu();
	let table_el = document.createElement("TABLE");
	menu_el.appendChild(table_el);

	for (let I = 0; I < InviteList.length; I++) {
		const Inv = InviteList[I];
		let tr = document.createElement("TR");
		table_el.appendChild(tr);

		//ユーザー情報
		let td1 = document.createElement("TD");
		tr.appendChild(td1);
		let icon = document.createElement("IMG");
		icon.style.width = "25px";
		icon.style.height = "25px";
		icon.src = "https://account.rumiserver.com/api/Icon?ID="+Inv.ID;
		td1.appendChild(icon);
		let name = document.createElement("SPAN");
		name.innerText = Inv.NAME;
		td1.appendChild(name);

		//可否
		let td2 = document.createElement("TD");
		tr.appendChild(td2);
		let ack_btn = document.createElement("BUTTON");
		ack_btn.innerText = "承認";
		ack_btn.addEventListener("click", (e)=>{ InviteACKButton(Inv.ID, ack_btn); });
		td2.appendChild(ack_btn);
		let rst_btn = document.createElement("BUTTON");
		ack_btn.innerText = "死ねしね消えろ";
		td2.appendChild(rst_btn);
	}
}

async function show_invite_url() {
	let menu_el = show_menu();
	//TODO:DOM操作に変更する
	menu_el.innerHTML = `<INPUT VALUE="https://chat.rumiserver.com/invite/${OpenGroupID}">`
}

async function InviteACKButton(ID, E) {
	await ACKInvite(OpenGroupID, ID);

	//ノードを削除
	E.parentNode.parentNode.remove();
}

/*function ConvertDATETIMEToDate(D) {
	const [DatePart, TimePart] = D.split(" ");
	const [Y, M, Day] = DatePart.split("-").map(Number);
	const [H, Min, S] = TimePart.split(":").map(Number);
	return new Date(Y, M - 1, Day, H, Min, S);
}*/

EL.CONTENTS.FILE_SELECT.addEventListener("change", async (e) => {
	for (let i = 0; i < EL.CONTENTS.FILE_SELECT.files.length; i++) {
		const f = EL.CONTENTS.FILE_SELECT.files[i];
		SelectFileList.push(f);
	}

	await UpdateSendFileList();
});

function SendMenuOC() {
	if (EL.CONTENTS.EXTEND.MENU.style.display == "none") {
		EL.CONTENTS.EXTEND.MENU.style.display = "block";
	} else {
		EL.CONTENTS.EXTEND.MENU.style.display = "none"
	}
}

async function UpdateSendFileList() {
	//クリアー
	EL.CONTENTS.EXTEND.FILE_LIST.innerHTML = "";

	for (let I = 0; I < SelectFileList.length; I++) {
		const file = SelectFileList[I];
		EL.CONTENTS.EXTEND.FILE_LIST.appendChild(await gen_file_item(file));
	}

	if (SelectFileList.length == 0) {
		EL.CONTENTS.EXTEND.FILE_LIST.style.display = "none";
	} else {
		EL.CONTENTS.EXTEND.FILE_LIST.style.display = "block";
	}
}

function OpenImageFileView(URL) {
	EL.FILE_VIWER.BG.style.display = "block";
	EL.FILE_VIWER.VIEWER.style.display = "block";

	EL.FILE_VIWER.VIEWER.innerHTML = `<IMG SRC="${URL}">`;
}

async function OpenBinaryFileView(url) {
	EL.FILE_VIWER.BG.style.display = "block";
	EL.FILE_VIWER.VIEWER.style.display = "block";

	EL.FILE_VIWER.VIEWER.appendChild(gen_hex_editor(await get_byte_from_url(url)));
}

function CloseFileView() {
	EL.FILE_VIWER.VIEWER.innerHTML = "";

	EL.FILE_VIWER.BG.style.display = "none";
	EL.FILE_VIWER.VIEWER.style.display = "none";
}

async function OpenSettingDialog() {
	EL.SETTING.BG.style.display = "block";
	EL.SETTING.DIALOG.style.display = "block";

	EL.SETTING.CONTENTS.CHAT.CTRL_SEND.checked = !setting["rc_enter_send"];
	EL.SETTING.CONTENTS.CHAT.URLCLEANER.checked = setting["rc_url_cleaner"];
}

async function apply_setting() {
	await RegistSetting(setting);
}

async function CloseSettingDialog() {
	EL.SETTING.BG.style.display = "none";
	EL.SETTING.DIALOG.style.display = "none";
}

let promode_click_count = 0;
async function switch_promode() {
	if (setting["pro_mode"]) return;

	promode_click_count++;

	if (promode_click_count > 5) {
		setting["pro_mode"] = true;
		await RegistSetting(setting);

		await dialog.DIALOG("Η λειτουργία Pro είναι ενεργοποιημένη");
		window.reload();
	}
}

async function CreateDMUI(UID) {
	try {
		const User = await GetACCOUNTFromUID(UID);
		if (User == null) return;

		await CreateDM(User.ID);
		await RefreshDMList();
	} catch (EX) {
		dialog.DIALOG("エラー");
	}
}

EL.CONTENTS.HOME.CREATE_DM.UID.addEventListener("keyup", async (e)=>{
	const UID = EL.CONTENTS.HOME.CREATE_DM.UID.value;
	if (UID == "" || UID == null) {
		EL.CONTENTS.HOME.CREATE_DM.LIST.innerHTML = "";
		return;
	};

	let ajax = await fetch("/api/Search/User?QUERY=" + UID);
	const result = await ajax.json();

	EL.CONTENTS.HOME.CREATE_DM.LIST.innerHTML = "";

	for (let I = 0; I < result.LIST.length; I++) {
		const row = result.LIST[I];
		EL.CONTENTS.HOME.CREATE_DM.LIST.innerHTML += `
			<DIV>
				<IMG SRC="https://account.rumiserver.com/api/Icon?ID=${row.ID}">
				<SPAN>${row.NAME}</SPAN>
				<BUTTON onclick="CreateDMUI('${row.UID}')">DMを開く</BUTTON>
			</DIV>
		`;
	}
});

async function open_user_profile(user_id) {
	let menu_el = show_menu();
	menu_el.className = "USER_PROFILE";
	const user = await GetACCOUNT(user_id);

	let user_el = document.createElement("DIV");
	user_el.className = "NAME";
	menu_el.appendChild(user_el);

	let icon_el = document.createElement("IMG");
	icon_el.className = `ICON_${user.ICON}`;
	icon_el.src = `https://account.rumiserver.com/api/Icon?UID=${user.UID}`;
	user_el.appendChild(icon_el);

	let name_el = document.createElement("SPAN");
	name_el.innerText = user.NAME;
	user_el.appendChild(name_el);

	let open_dm_button = document.createElement("BUTTON");
	open_dm_button.innerText = "DMを開く";
	open_dm_button.addEventListener("click", async (e)=>{
		const dm = DMList.find(row=>row.UID == user_id);
		if (dm != null) {
			rspa.OPEN_URI(`/dm/${dm.ID}`);
		} else {
			await CreateDM(user_id);
			DMList = await GetDMList();
			rspa.OPEN_URI(`/dm/${DMList.find(row=>row.UID == user_id).ID}`);
		}

		dialog.CLOSE_MENU(menu_el.parentElement.id.replace("MENU_", ""));
	});
	user_el.appendChild(open_dm_button);

	let desc_el = document.createElement("DIV");
	desc_el.className = "DESC";
	desc_el.innerText = user.DESCRIPTION;
	menu_el.appendChild(desc_el);
}