function format_datetime(date) {
	const d = new Date(date);

	const year = d.getFullYear();
	const month = d.getMonth() + 1;
	const day = d.getDate();
	let hour = d.getHours();
	const min = d.getMinutes().toString().padStart(2, "0");
	const sec = d.getSeconds().toString().padStart(2, "0");
	let ampm = "";

	if (hour < 12) {
		ampm = "午前";
	} else {
		ampm = "午後";
	}

	hour = hour % 12;
	if (hour === 0) hour = 12;

	return `${year}年${month}月${day}日 ${ampm}${hour}時${min}分${sec}秒`;
}