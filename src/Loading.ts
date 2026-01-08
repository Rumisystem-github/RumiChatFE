type PrefixData = {
	text: string,
	color: string
};

const PREFIX_INFO: PrefixData = {text: " INFO ", color: "rgb(0, 0, 0)"};
export const PREFIX_OK: PrefixData = {text: "  OK  ", color: "rgb(0, 255, 0)"};
export const PREFIX_FAILED: PrefixData = {text: "FAILED", color: "rgb(255, 0, 0)"};

function gen_log_prefix(prefix: PrefixData): HTMLSpanElement {
	let el = document.createElement("SPAN") as HTMLSpanElement;

	//[
	let a = document.createElement("SPAN");
	a.innerText = "[";
	el.append(a);

	//中
	let b = document.createElement("SPAN");
	b.className = "INNER";
	b.innerText = prefix.text;
	b.style.color = prefix.color;
	el.append(b);

	//]
	let c = document.createElement("SPAN");
	c.innerText = "] ";
	el.append(c);

	return el;
}

export function loading_print_info(message: string) {
	let el = document.getElementById("LOADING_LOG") as HTMLDivElement;
	if (el == null) return;

	//行
	let log_row = document.createElement("DIV");

	//Prefix
	log_row.append(gen_log_prefix(PREFIX_INFO));

	//メセージ
	let message_el = document.createElement("SPAN");
	message_el.innerText = message;
	log_row.append(message_el);

	el.append(log_row);
}

export function loading_message(message: string) {
	let el = document.getElementById("LOADING_MESSAGE") as HTMLDivElement;
	if (el == null) return;

	el.innerText = message;
}

export function loading_print_progress(message: string): string {
	const id = crypto.randomUUID();

	let el = document.getElementById("LOADING_LOG") as HTMLDivElement;
	if (el == null) return id;

	//行
	let log_row = document.createElement("DIV");
	log_row.className = "LOG_ROW";
	log_row.dataset["id"] = id;

	//Prefix
	let prefix = gen_log_prefix({text: "*   **", color: "rgb(0, 0, 0)"});
	let inner = prefix.querySelector(".INNER")!;
	log_row.append(prefix);

	let i = 1;
	const interval = setInterval(() => {
		switch (i) {
			case 0:
				inner.innerHTML = "*   **";
				break;
			case 1:
				inner.innerHTML = "**   *";
				break;
			case 2:
				inner.innerHTML = "***   ";
				break;
			case 3:
				inner.innerHTML = " ***  ";
				break;
			case 4:
				inner.innerHTML = "  *** ";
				break;
			case 5:
				inner.innerHTML = "   ***";
				break;
			default:
				i = 0;
				return;
		}
		i += 1;
	}, 500);
	log_row.dataset["interval"] = interval.toString();

	//メセージ
	let message_el = document.createElement("SPAN");
	message_el.innerText = message;
	log_row.append(message_el);

	el.append(log_row);

	return id;
}

export function loading_end_progress(id: string, prefix: PrefixData) {
	let row_el = document.querySelector(`.LOG_ROW[data-id="${id}"]`) as HTMLDivElement;
	if (row_el == null) return;

	//アニメーション停止
	clearInterval(Number.parseInt(row_el.dataset["interval"]!));

	let inner = row_el.querySelector("SPAN")?.querySelector(".INNER")! as HTMLSpanElement;
	inner.innerHTML = prefix.text;
	inner.style.color = prefix.color;
}