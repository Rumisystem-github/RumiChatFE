const InitUIMode = {
	None: 0,
	Home: 1,
	Group: 2,
	Room: 3,
	DM: 4,
	Invite: 5
};

function InitUI(Mode) {
	//グループの情報
	if (!(Mode == InitUIMode.Group)) {
		GroupInfoClose();
	}

	//グループの部屋リスト
	if (!(Mode == InitUIMode.Group || Mode == InitUIMode.Room)) {
		GroupRoomListClose();
	}

	//チャットルーム
	if (!(Mode == InitUIMode.Room || Mode == InitUIMode.DM)) {
		ChatClose();
	}

	//DM一覧
	if (!(Mode == InitUIMode.Home || Mode == InitUIMode.DM)) {
		DMClose();
		EL.CONTENTS.DM.style.display = "none";
	}

	if (!(Mode == InitUIMode.Home)) {
		EL.CONTENTS.DM.style.display = "none";
	}
}

async function PageHome(RETURN) {
	//画面初期化
	InitUI(InitUIMode.Home);

	EL.CONTENTS.DM.style.display = "block";

	//変数を初期化(TempOpenRoomIDは初期化するな)
	OpenGroupID = null;
	OpenRoomID = null;
	OpenGroup = null;
	OpenRoom = null;

	await RefreshDMList();
}

async function PageGroup(RETURN) {
	const ID = window.location.pathname.match(/\/chat\/(\d{0,100})/)[1];
	const Group = await GetGroup(ID);

	//変数にばーん
	OpenGroupID = ID;
	OpenGroup = Group;

	//初期化
	InitUI(InitUIMode.Group);

	//画面関係
	RefreshRoomList(ID);
	GroupRoomListShow();
	GroupInfoShow();
	ChatClose();
	DMClose();
}

async function PageRoom(RETURN) {
	const GID = window.location.pathname.match(/\/chat\/(\d{0,100})\//)[1];
	const RID = window.location.pathname.match(/\/chat\/\d{0,100}\/(\d{0,100})/)[1];

	let Page = 0;
	if (ChatMessagePage[RID] == null) {
		ChatMessagePage[RID] = 0;
	}
	Page = ChatMessagePage[RID];

	//取得
	const Group = await GetGroup(GID);
	const Room = await GetRoom(RID);
	const MessageList = await GetMessageList(RID, Page);

	//うんち
	OpenGroupID = GID;
	OpenRoomID = RID;
	OpenGroup = Group;
	OpenRoom = Room;
	LastOpenRoomID[GID] = RID;
	document.cookie = `LAST_OPEN_ROOM=${encodeURIComponent(JSON.stringify(LastOpenRoomID))}; max-age=${60 * 60 * 24 * 7}; path=/`;

	//初期化
	InitUI(InitUIMode.Room);

	await RefreshRoomList(GID);
	GroupRoomListShow();

	//既読
	await UpdateACK(RID);

	EL.CONTENTS.MESSAGELIST.innerHTML = "";

	for (let I = 0; I < MessageList.length; I++) {
		const ROW = MessageList[I];
		EL.CONTENTS.MESSAGELIST.prepend(await GenMessageItem(ROW.MESSAGE, ROW.USER));
	}

	//チャットルームを表示
	await ChatShow();

	//一番下までスクロール
	MessageListBottomScroll();
}

async function PageDM(RETURN) {
	const RID = window.location.pathname.match(/\/dm\/(\d{0,100})/)[1];

	//初期化
	InitUI(InitUIMode.DM);

	let Page = 0;
	if (ChatMessagePage[RID] == null) {
		ChatMessagePage[RID] = 0;
	}
	Page = ChatMessagePage[RID];

	await RefreshDMList();

	const Room = await GetRoom(RID);
	const UID = DMList.find(Row=>Row.ID == RID).UID;
	const MessageList = await GetMessageList(RID, Page);

	OpenGroupID = null;
	OpenRoomID = RID;
	OpenGroup = null;
	OpenRoom = Room;

	await ImportPGPKey(UID);

	//既読
	await UpdateACK(RID);

	EL.CONTENTS.MESSAGELIST.innerHTML = "";

	for (let I = 0; I < MessageList.length; I++) {
		const ROW = MessageList[I];
		EL.CONTENTS.MESSAGELIST.prepend(await GenMessageItem(ROW.MESSAGE, ROW.USER));
	}

	//チャットルームを表示
	await ChatShow();

	//一番下までスクロール
	MessageListBottomScroll();
}

async function PageInvite(RETURN) {
	const GID = window.location.pathname.match(/\/invite\/(\d{0,100})/)[1];
	const Group = await GetGroup(GID);

	//画面初期化
	InitUI(InitUIMode.Invite);

	const Q = await dialog.INPUT(`「${htmlspecialchars(Group.NAME)}」に参加しますか？`, { TYPE: "NONE" });
	if (Q != null) {
		//GoGoGo
		await CreateInvite(GID);
		dialog.DIALOG("招待を作成しました、管理者に承認されるまでお待ちください。");
	} else {
		//キャンセル
		rspa.OPEN_URI("/");
	}
}
