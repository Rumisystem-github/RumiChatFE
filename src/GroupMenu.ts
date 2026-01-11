import { edit_invite_list, get_invite_list } from "./API";
import { copy, mel, show_dialog_bg } from "./Main";

export function init_group_menu(group_id: string) {
	mel.side.group_header.parent.addEventListener("click", ()=>{
		const bg = show_dialog_bg(false);
		bg.addEventListener("click", ()=>{
			close(bg);
		});

		mel.menu.group.invite.onclick = async function() {
			const url = `https://${window.location.hostname}/invite.html?ID=${group_id}`;
			await copy(url);
			close(bg);
		};

		mel.menu.group.invite_list.onclick = async function() {
			const invite_list = await get_invite_list(group_id);

			const dialog_bg = show_dialog_bg(true);
			close(bg);

			function _close() {
				mel.dialog.group_invite_list.parent.dataset["hide"] = "true";
				dialog_bg.remove();
			}

			//初期化
			mel.dialog.group_invite_list.table.replaceChildren();

			//セット
			for (const user of invite_list) {
				let tr = document.createElement("TR");
				mel.dialog.group_invite_list.table.append(tr);

				let icon_td = document.createElement("TD");
				icon_td.className = "ICON";
				tr.append(icon_td);
				let icon = document.createElement("IMG") as HTMLImageElement;
				icon.src = `https://account.rumiserver.com/api/Icon?ID=${user.ID}`;
				icon_td.append(icon);

				let name_td = document.createElement("TD");
				name_td.className = "NAME";
				name_td.innerText = user.NAME;
				tr.append(name_td);

				let controll_td = document.createElement("TD");
				tr.append(controll_td);

				let accept_button = document.createElement("BUTTON");
				accept_button.innerText = "O";
				accept_button.addEventListener("click", async ()=>{
					await edit_invite_list(group_id, user.ID, true);
					tr.remove();
				});
				controll_td.append(accept_button);

				let rejection_button = document.createElement("BUTTON");
				rejection_button.innerText = "X"
				rejection_button.addEventListener("click", async ()=>{
					await edit_invite_list(group_id, user.ID, false);
					tr.remove();
				});
				controll_td.append(rejection_button);
			}

			mel.dialog.group_invite_list.parent.dataset["hide"] = "false";

			dialog_bg.addEventListener("click", _close);
		};

		mel.menu.group.parent.dataset["hide"] = "false";
	});
}

function close(bg: HTMLDivElement) {
	bg.remove();
	mel.menu.group.parent.dataset["hide"] = "true";
}