import { mel, show_popup_bg } from "./Main";

export function init_group_menu(group_id: string) {
	mel.side.group_header.parent.addEventListener("click", ()=>{
		const bg = show_popup_bg(false);
		bg.addEventListener("click", ()=>{
			close(bg);
		});

		mel.menu.group.invite.onclick = function() {
			console.log(group_id);
			close(bg);
		};

		mel.menu.group.parent.dataset["hide"] = "false";
	});
}

function close(bg: HTMLDivElement) {
	bg.remove();
	mel.menu.group.parent.dataset["hide"] = "true";
}