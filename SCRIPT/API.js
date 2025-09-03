//--------------------------------------------------るみ鯖アカウント
async function GetACCOUNT(ID) {
	let AJAX = await fetch(ACCOUNT_API + "User?ID=" + ID + "&SERVICE=RUMICHAT", {
		method: "GET",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return RESULT.ACCOUNT;
	} else {
		throw new Error(RESULT.ERR);
	}
}
async function GetACCOUNTFromUID(UID) {
	let AJAX = await fetch(ACCOUNT_API + "User?UID=" + UID + "&SERVICE=RUMICHAT", {
		method: "GET",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return RESULT.ACCOUNT;
	} else {
		throw new Error(RESULT.ERR);
	}
}

//--------------------------------------------------サービス使用
async function GetUseSERVICE() {
	let AJAX = await fetch(ACCOUNT_API + "Service?SERVICE=RUMICHAT", {
		method: "GET",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return RESULT.USE;
	} else {
		throw new Error(RESULT.ERR);
	}
}

async function SetUseSERVICE() {
	let AJAX = await fetch(ACCOUNT_API + "Service?SERVICE=RUMICHAT", {
		method: "POST",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return;
	} else {
		throw new Error(RESULT.ERR);
	}
}

async function RemoveUseSERVICE() {
	let AJAX = await fetch(ACCOUNT_API + "Service?SERVICE=RUMICHAT", {
		method: "DELETE",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return;
	} else {
		throw new Error(RESULT.ERR);
	}
}
//--------------------------------------------------グループ
async function GetGroupList() {
	let AJAX = await fetch("/api/Group", {
		method: "GET",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return RESULT.LIST;
	} else {
		throw new Error(RESULT.ERR);
	}
}

async function GetGroup(ID) {
	let AJAX = await fetch("/api/Group?ID=" + ID, {
		method: "GET",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return RESULT.GROUP;
	} else {
		throw new Error(RESULT.ERR);
	}
}

async function CreateGroup(Name) {
	let AJAX = await fetch("/api/Group", {
		method: "POST",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store",
		body: JSON.stringify({
			NAME: Name
		})
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return;
	} else {
		throw new Error(RESULT.ERR);
	}
}
//--------------------------------------------------部屋
async function GetRoomList(ID) {
	let AJAX = await fetch("/api/Room?GID=" + ID, {
		method: "GET",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return RESULT.LIST;
	} else {
		throw new Error(RESULT.ERR);
	}
}

async function GetRoom(ID) {
	let AJAX = await fetch("/api/Room?ID=" + ID, {
		method: "GET",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return RESULT.ROOM;
	} else {
		throw new Error(RESULT.ERR);
	}
}

async function CreateRoom(GID, Name) {
	let AJAX = await fetch("/api/Room?GID=" + GID, {
		method: "POST",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store",
		body: JSON.stringify({
			NAME: Name
		})
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return;
	} else {
		throw new Error(RESULT.ERR);
	}
}
//--------------------------------------------------DM
async function GetDMList() {
	let AJAX = await fetch("/api/DM", {
		method: "GET",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return RESULT.LIST;
	} else {
		throw new Error(RESULT.ERR);
	}
}

async function CreateDM(UID) {
	let AJAX = await fetch("/api/DM?UID=" + UID, {
		method: "POST",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return;
	} else {
		throw new Error(RESULT.ERR);
	}
}
//--------------------------------------------------メッセージ
async function GetMessageList(ID, Page) {
	let AJAX = await fetch(`/api/Message?RID=${ID}&PAGE=${Page}`, {
		method: "GET",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return RESULT.LIST;
	} else {
		throw new Error(RESULT.ERR);
	}
}
async function SendMessage(RID, Text) {
	let AJAX = await fetch("/api/Message?RID=" + RID, {
		method: "POST",
		headers: {
			TOKEN: SESSION
		},
		body: JSON.stringify({
			TEXT: Text
		})
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return;
	} else {
		throw new Error(RESULT.ERR);
	}
}
async function SendFileMessage(RID, Text, FileList) {
	let AJAX = await fetch("/api/Message?RID=" + RID, {
		method: "POST",
		headers: {
			TOKEN: SESSION
		},
		body: JSON.stringify({
			TEXT: Text,
			FILE: FileList
		})
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return RESULT.FILE;
	} else {
		throw new Error(RESULT.ERR);
	}
}
//--------------------------------------------------添付ファイル
async function UpoadFile(ID, Data) {
	let AJAX = await fetch("/api/File/Upload?ID=" + ID, {
		method: "POST",
		headers: {
			TOKEN: SESSION
		},
		body: Data
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return;
	} else {
		throw new Error(RESULT.ERR);
	}
}
async function UpoadFinalize(ID) {
	let AJAX = await fetch("/api/File/Finalize?ID=" + ID, {
		method: "POST",
		headers: {
			TOKEN: SESSION
		},
		body: ""
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return;
	} else {
		throw new Error(RESULT.ERR);
	}
}
//--------------------------------------------------招待
async function GetInviteList(GID) {
	let AJAX = await fetch("/api/Invite?GID=" + GID, {
		method: "GET",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return RESULT.LIST;
	} else {
		throw new Error(RESULT.ERR);
	}
}

async function CreateInvite(GID) {
	let AJAX = await fetch("/api/Invite?GID=" + GID, {
		method: "POST",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return;
	} else {
		throw new Error(RESULT.ERR);
	}
}

async function ACKInvite(GID, UID) {
	let AJAX = await fetch("/api/Invite?GID=" + GID + "&UID=" + UID, {
		method: "PATCH",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return;
	} else {
		throw new Error(RESULT.ERR);
	}
}

async function DeleteInvite(GID, UID) {
	let AJAX = await fetch("/api/Invite?GID=" + GID + "&UID=" + UID, {
		method: "DELETE",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return;
	} else {
		throw new Error(RESULT.ERR);
	}
}
//--------------------------------------------------既読
async function GetACKList(GID) {
	let AJAX = await fetch("/api/ACK?GID=" + GID, {
		method: "GET",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return RESULT.LIST;
	} else {
		throw new Error(RESULT.ERR);
	}
}
async function UpdateACK(RID) {
	let AJAX = await fetch("/api/ACK?RID=" + RID, {
		method: "PATCH",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return;
	} else {
		throw new Error(RESULT.ERR);
	}
}

async function GetGuildACK(GID) {
	const ACKList = await GetACKList(GID);

	for (let I = 0; I < Object.keys(ACKList).length; I++) {
		if (!ACKList[Object.keys(ACKList)[I]]) {
			return false;
		}
	}

	return true;
}
//--------------------------------------------------PGP鍵
async function GetPGPPublicKey(ID) {
	let AJAX = await fetch("/api/PGP/Public?ID=" + ID, {
		method: "GET",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return RESULT.KEY;
	} else {
		throw new Error(RESULT.ERR);
	}
}

async function RegistPGPPublicKey(Key) {
	let AJAX = await fetch("/api/PGP/Public", {
		method: "POST",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store",
		body: JSON.stringify({
			KEY: Key
		})
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return;
	} else {
		throw new Error(RESULT.ERR);
	}
}
//--------------------------------------------------設定
async function GetSetting() {
	let AJAX = await fetch("/api/Setting", {
		method: "GET",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return RESULT.SETTING;
	} else {
		throw new Error(RESULT.ERR);
	}
}
async function RegistSetting(body) {
	let AJAX = await fetch("/api/Setting", {
		method: "POST",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store",
		body: JSON.stringify(body)
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return;
	} else {
		throw new Error(RESULT.ERR);
	}
}

async function ClearSetting() {
	let AJAX = await fetch("/api/Setting", {
		method: "DELETE",
		headers: {
			TOKEN: SESSION
		},
		cache: "no-store"
	});

	const RESULT = await AJAX.json();
	if (RESULT.STATUS) {
		return;
	} else {
		throw new Error(RESULT.ERR);
	}
}