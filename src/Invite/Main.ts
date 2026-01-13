import { LOGIN_PAGE_URL } from "../const";
import { login } from "../Login";
import type { GetGroupListResponse, GetGroupResponse } from "../Type/APIResponseType";
import type { Group } from "../Type/Group";

let token = "";
let group_id = "";
let group_is_private = false;
let mel = {
	plz_wait: document.getElementById("PLZ_WAIT")!,
	main: {
		parent: document.getElementById("MAIN")!,
		group_name: document.getElementById("GROUP_NAME")!,
		join_button: document.getElementById("JOIN_BUTTON")!
	}
};

window.addEventListener("load", async ()=>{
	const login_result = await login();
	if (!login_result.status) {
		window.location.href = LOGIN_PAGE_URL;
		return;
	}
	token = login_result.token!;

	const join_group = await get_join_group();

	//URLパラメーター
	const param = new URLSearchParams(window.location.search);
	if (param.get("ID") == null) return;
	group_id = param.get("ID")!;

	if (join_group.some((group)=>group.ID == group_id)) {
		mel.plz_wait.innerText = "既に参加済みのグループです";
		return;
	}

	const group = await get_group(group_id);
	group_is_private = group.PRIVATE;

	mel.main.group_name.innerText = group.NAME;
	if (group_is_private) {
		mel.main.join_button.innerText = "参加申請";
	} else {
		mel.main.join_button.innerText = "参加";
	}

	mel.plz_wait.style.display = "none";
	mel.main.parent.style = "block";
});

mel.main.join_button.addEventListener("click", async ()=>{
	let ajax = await fetch("/api/Invite?GROUP_ID=" + group_id, {
		method: "POST",
		headers: {
			"TOKEN": token,
			"Accept": "application/json"
		},
	});
	const result = await ajax.json();
	if (result["STATUS"]) {
		if (group_is_private) {
			alert("参加申請しました、承認されるまで待ってね。");
			window.location.href = "/";
		} else {
			window.location.href = `/chat/${group_id}`;
		}
	} else {
		alert("えらー");
	}
});

async function get_group(group_id: string): Promise<Group> {
	let ajax = await fetch("/api/Group?ID=" + group_id, {
		method: "GET",
		headers: {
			"TOKEN": token,
			"Content-Type": "application/json",
			"Accept": "application/json"
		}
	});
	const result = (await ajax.json()) as GetGroupResponse;
	if (!result.STATUS) {
		throw new Error("取得失敗");
	}

	return result.GROUP;
}

async function get_join_group(): Promise<Group[]> {
	let ajax = await fetch("/api/Group", {
		method: "GET",
		headers: {
			"TOKEN": token,
			"Content-Type": "application/json",
			"Accept": "application/json"
		}
	});
	const result = (await ajax.json()) as GetGroupListResponse;
	if (!result.STATUS) {
		throw new Error("取得失敗");
	}

	return result.LIST;
}