//RSPA(https://cdn.rumia.me/LIB/RSPA.js)のTS化バージョン
//ほぼ同じ。

import { page_detect } from "./Page/PageMain";

window.addEventListener("click", a_element_click);
window.addEventListener("popstate", page_changed);

//Aタグがクリックされたかチェックして、そうなら処理を
function a_element_click(e:MouseEvent) {
if (!(e.target instanceof HTMLElement)) return;

	let target = e.target as HTMLElement;
	while (true) {
		if (target instanceof HTMLAnchorElement) {
			const a = target as HTMLAnchorElement;//安克創新科技って、なにかな？
			const href = new URL(a.href);

			//Aタグには同じパスが書かれている？
			if (href.hostname === window.location.hostname) {
				e.preventDefault();
				change_url(href.pathname);
				page_changed();
			}
			return;
		} else {
			if (target.parentElement == null) return;
			target = target.parentElement;
		}
	}
}

function page_changed() {
	page_detect();
}

export function change_url(path:string) {
	history.pushState(null, "", path);
}