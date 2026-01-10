import { get_invite_list } from "./API";
import { copy, mel, show_popup_bg } from "./Main";

export function init_group_menu(group_id: string) {
	mel.side.group_header.parent.addEventListener("click", ()=>{
		const bg = show_popup_bg(false);
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
			console.log(invite_list);
			close(bg);

			const dialog_bg = show_popup_bg(true);
			dialog_bg.onclick = function() {
				dialog_bg.remove();
			};
		};

		mel.menu.group.parent.dataset["hide"] = "false";
	});
}

function close(bg: HTMLDivElement) {
	bg.remove();
	mel.menu.group.parent.dataset["hide"] = "true";
}