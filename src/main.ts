import "./style.css"

window.addEventListener("load", ()=>{
	let count_el = document.getElementById("count");
	if (count_el != null) count_el.innerText = "0";

	let add_button = document.getElementById("add");
	if (add_button != null) add_button.addEventListener("click", add);

	let sub_button = document.getElementById("sub");
	if (sub_button != null) sub_button.addEventListener("click", sub);

	let mul_button = document.getElementById("mul");
	if (mul_button != null) mul_button.addEventListener("click", mul);

	let div_button = document.getElementById("div");
	if (div_button != null) div_button.addEventListener("click", div);
});

function add() {
	let count_el = document.getElementById("count");
	if (count_el != null) {
		const num = Number.parseInt(count_el.innerText);
		count_el.innerText = `${num + 1}`;
	}
}

function sub() {
	let count_el = document.getElementById("count");
	if (count_el != null) {
		const num = Number.parseInt(count_el.innerText);
		count_el.innerText = `${num - 1}`;
	}
}

function mul() {
	let count_el = document.getElementById("count");
	if (count_el != null) {
		const num = Number.parseInt(count_el.innerText);
		count_el.innerText = `${num * 2}`;
	}
}

function div() {
	let count_el = document.getElementById("count");
	if (count_el != null) {
		const num = Number.parseInt(count_el.innerText);
		count_el.innerText = `${num / 2}`;
	}
}