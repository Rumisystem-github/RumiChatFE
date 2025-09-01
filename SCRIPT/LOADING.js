_LOADING_EL = document.getElementById("LOADING_DISPLAY_LOG");
const __LOADING_PAGE = LOAD_WAIT_PRINT("ページを読み込み中");

function CLOSE_LOAD() {
	document.getElementById("LOADING_DISPLAY").remove();
}

window.addEventListener("load", (E)=>{
	LOAD_WAIT_STOP(__LOADING_PAGE, "OK");
});

function OPEN_CLOAD() {
	MEL.CONTENTS_LOADING.style.display = "block";
}

function CLOSE_CLOAD() {
	MEL.CONTENTS_LOADING.style.display = "none";
}