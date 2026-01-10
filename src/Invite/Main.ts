import { LOGIN_PAGE_URL } from "../const";
import { login } from "../Login";
import type { Group } from "../Type/Group";

type GetGroupResponse = {
	STATUS: boolean,
	GROUP: Group
};

let token = "";
let group_id = "";

window.addEventListener("load", async ()=>{
	const login_result = await login();
	if (!login_result.status) {
		window.location.href = LOGIN_PAGE_URL;
		return;
	}
	token = login_result.token!;

	//URLパラメーター
	const param = new URLSearchParams(window.location.search);
	if (param.get("ID") == null) return;
	group_id = param.get("ID")!;

	//グループ取得
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
		return;
	}

	document.getElementById("GROUP_NAME")!.innerText = result.GROUP.NAME;
});

document.getElementById("JOIN_BUTTON")!.addEventListener("click", async ()=>{
	let ajax = await fetch("/api/Invite?GROUP_ID=" + group_id, {
		method: "POST",
		headers: {
			"TOKEN": token,
			"Accept": "application/json"
		},
	});
	const result = await ajax.json();
	if (result["STATUS"]) {
		//成功
	} else {
		//失敗
	}
});