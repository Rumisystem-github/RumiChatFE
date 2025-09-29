function GenGroupItem(Group, ACK) {
	let item = document.createElement("DIV");
	item.className = "GROUPITEM";
	item.dataset["id"] = Group.ID;
	item.addEventListener("click", (e)=>{
		ClickGroupItem(Group.ID);
	});

	let icon = document.createElement("DIV");
	icon.innerText = Group.NAME;

	item.appendChild(icon);

	if (ACK) {
		item.dataset["ack"] = "true";
	} else {
		item.dataset["ack"] = "false";
	}

	return item;
}

function GenRoomItem(Room, ACK) {
	let parent = document.createElement("A");
	parent.href = `/chat/${Room.GID}/${Room.ID}`;
	parent.addEventListener("click", (e)=>{
		ChatMessagePage[Room.ID] = 0;
	});

	let item = document.createElement("DIV");
	item.className = "ROOMITEM";
	item.dataset["id"] = Room.ID;
	item.innerText = Room.NAME;
	parent.appendChild(item);

	if (ACK) {
		item.dataset["ack"] = "true";
	} else {
		item.dataset["ack"] = "false";
	}

	return parent;
}

function GenDMItem(DM) {
	let parent = document.createElement("A");
	parent.href = `/dm/${DM.ID}`;
	parent.addEventListener("click", (e)=>{
		ChatMessagePage[DM.ID] = 0;
	});

	let icon = document.createElement("IMG");
	icon.className = "ICON_CIRCLE";
	icon.src = `https://account.rumiserver.com/api/Icon?ID=${DM.UID}`;
	icon.style.width = "35px";
	icon.style.height = "35px";

	let name = document.createElement("SPAN");
	name.innerText = DM.NAME;

	let item = document.createElement("DIV");
	item.className = "ROOMITEM";
	item.dataset["id"] = DM.ID;
	item.dataset["uid"] = DM.UID;
	item.appendChild(icon);
	item.appendChild(name);
	parent.appendChild(item);

	if (DM.ACK) {
		item.dataset["ack"] = "true";
	} else {
		item.dataset["ack"] = "false";
	}

	return parent;
}

async function GenMessageItem(Message, User) {
	let UserName = User.NAME;
	let Text = Message.TEXT;

	//暗号なら解読
	if (/^-----BEGIN PGP MESSAGE-----[\s\S]*?-----END PGP MESSAGE-----$/m.test(Text)) {
		try {
			Text = htmlspecialchars(((await DecryptText(Text, SelfPGPKey.Private))).data);
			UserName += "<IMG SRC=\"/Asset/MdiLock.svg\">";
		} catch(EX) {
			Text = "Error:解読できませんでした";
		}
	} else {
		Text = htmlspecialchars(Text);
	}

	//本文をRMD変換
	//TODO:るみスクリプトで、HTMLタグの置換を防止する仕組みを実装してから再実装しよう。
	//Text = RMD_CONV(Text);

	//URLをAタグに変換(既にAタグ化しているURLは除外)
	Text = LinkifyHTML(Text);

	let item = document.createElement("DIV");
	item.className = "MESSAGEITEM";

	//ユーザー
	let user = document.createElement("DIV");
	user.className = "USER";
	item.appendChild(user);

	//アイコン
	let user_icon = document.createElement("IMG");
	user_icon.className = "ICON";
	user_icon.src = `https://account.rumiserver.com/api/Icon?ID=${User.ID}`;
	user.appendChild(user_icon);
	//ユーザー名
	let user_name = document.createElement("SPAN");
	user_name.className = "NAME";
	user_name.innerText = UserName;
	user.appendChild(user_name);
	//日時
	let date = document.createElement("SPAN");
	date.className = "DATE";
	date.innerText = format_datetime(Message.DATE)+"秒";
	user.appendChild(date);

	//本文
	let text = document.createElement("DIV");
	text.className = "TEXT";
	text.innerHTML = Text;
	item.appendChild(text);

	if (Message.FILE.length != 0) {
		item.appendChild(await gen_message_file_item(Message.FILE));
	}

	return item;


	/*return `
	<DIV CLASS="">
		${await (async function () {
			if (.length != 0) {
				let Body = `<DIV CLASS="">`;

				//ファイルを順番にチェックする
				

				Body += `</DIV>`;
				return Body;
			} else {
				return "";
			}
		})()}
	</DIV>`;*/
}

async function gen_message_file_item(file) {
	let file_list = document.createElement("DIV");
	file_list.className = "FILE_LIST";

	console.log(file);

	for (let I = 0; I < file.length; I++) {
		const f = file[I];
		let item = document.createElement("DIV");
		item.className = "FILE_ITEM";
		file_list.appendChild(item);
		let contents = document.createElement("DIV");
		contents.className = "FILE";
		item.appendChild(contents);
		let control = document.createElement("DIV");
		control.className = "CONTROLE";
		control.innerHTML = `<A HREF="${f.url}" download><BUTTON>ダウンロード</BUTTON></A>`;
		item.appendChild(control);

		try {
			switch(detect_file_type(f.TYPE)) {
				case file_type_group.Image:
					const img = await get_image_from_url(f.URL);
					const new_height = img.height * (400 / img.width);
					let img_el = document.createElement("IMG");
					img_el.src = f.URL;
					img_el.addEventListener("click", (e)=>{
						OpenFileView(f.URL);
					});
					img_el.style.height = `${new_height}px`;
					contents.appendChild(img_el);
					img.remove();
					break;

				case file_type_group.Video:
					let video_el = document.createElement("VIDEO");
					video_el.src = f.URL;
					video_el.contents = true;
					contents.appendChild(video_el);
					break;

				default:
					const data = await get_byte_from_url(f.URL);

					//テキストファイルか？
					if (is_textfile(data)) {
						let text_el = document.createElement("TEXTAREA");
						text_el.innerText = new TextDecoder("UTF-8").decode(data);
						text_el.style.width = "100%";
						text_el.style.height = "500px";
						text_el.readonly = true;
						contents.appendChild(text_el);
					} else {
						contents.appendChild(gen_hex_editor(data));
					}
					break;
			}
		} catch(ex) {
			let span = document.createElement("SPAN");
			span.innerText = "添付ファイル";
			contents.appendChild(span);
		}
	}

	return file_list;
}

function gen_hex_editor(data) {
	let length = data.length;
	if (length > 100) {
		length = 300;
	}

	const header = `<TH>0</TH><TH>1</TH><TH>2</TH><TH>3</TH><TH>4</TH><TH>5</TH><TH>6</TH><TH>7</TH><TH>8</TH><TH>9</TH><TH>A</TH><TH>B</TH><TH>C</TH><TH>D</TH><TH>E</TH><TH>F</TH>`;
	let hex_map = [[]];
	let col = 0;
	let row = 0;
	for (let i = 0; i < length; i++) {
		const hex = data[i].toString(16).padStart(2, "0");
		hex_map[row][col] = hex;
		col += 1;

		//Fまで来たら次の行へ
		if (col == 16) {
			col = 0;
			row += 1;
			hex_map[row] = [];
		}
	}

	//<DIV CLASS="HEX_EDITOR">
	let parent = document.createElement("DIV");
	parent.className = "HEX_EDITOR";

	//<TABLE CLASS="HEX_LIST">
	let hex_list = document.createElement("TABLE");
	hex_list.className = "HEX_LIST";
	hex_list.innerHTML = `
		<TR CLASS="HEX_HEADER">
			<TH></TH>${header}
		</TR>
	`;

	//<TABLE CLASS="ASCII_LIST">
	let ascii_list = document.createElement("TABLE");
	ascii_list.className = "ASCII_LIST";
	ascii_list.innerHTML = `<TR CLASS="HEX_HEADER">${header}</TR>`;

	//親に入れる
	parent.appendChild(hex_list);
	parent.appendChild(ascii_list);

	for (let i = 0; i < hex_map.length; i++) {
		//HEX
		let hex_row = document.createElement("TR");
		hex_row.className = "HEX_ITEM";
		hex_row.innerHTML = `<TH CLASS="HEX_ROW">${(i*16).toString(16).padStart(6, "0").toUpperCase()}</TH>`;
		//ASCII
		let ascii_row = document.createElement("TR");

		for (let j = 0; j < hex_map[i].length; j++) {
			const hex = hex_map[i][j].toUpperCase();
			//HEX
			let hex_col = document.createElement("TD");
			hex_col.className = "HEX_CONTENTS";
			hex_col.innerText = hex;
			hex_row.appendChild(hex_col);

			//ASCII
			let ascii_col = document.createElement("TD");
			ascii_col.className = "ASCII_CONTENTS";
			ascii_col.dataset["hex"] = hex;
			ascii_col.innerText = hex_to_ascii(hex);
			ascii_row.appendChild(ascii_col);
		}

		//リストへ追加
		hex_list.appendChild(hex_row);
		ascii_list.appendChild(ascii_row);
	}

	return parent;
}

function hex_to_ascii(hex) {
	const byte = parseInt(hex, 16);

	if (byte >= 0x20 && byte <= 0x7E) {
		return String.fromCharCode(byte);
	} else {
		return ".";
	}
}

/**
 * バイナリをデコードし、UTF-8として解釈できるかを返します。
 * @param {Uint8Array} data データ
 * @returns 解釈できるならtrue
 */
function is_textfile(data) {
	try {
		new TextDecoder("UTF-8", {fatal: true}).decode(data);
		return true;
	} catch(ex) {
		return false;
	}
}

/**
 * Uint8ArrayをDataURLへ変換します。
 * @param {Uint8Array} data データ
 * @param {string} type MimeType
 * @returns 
 */
function unit8array_to_dataurl(data, type) {
	const blob = new Blob([data], {type: type});
	const url = URL.createObjectURL(blob);

	return url;
}

/**
 * URLからデータをロードし、100MBを越えた場合に例外を返します。
 * @param {string} url URL
 * @returns Uint8Array
 */
async function get_byte_from_url(url) {
	let ajax = await fetch(url);
	if (!ajax.body) throw new Error("ストリーミング非対応");

	const reader = ajax.body.getReader();
	let total = 0;
	let chunks = [];
	while (true) {
		const {done, value} = await reader.read();
		if (done) break;
		chunks.push(value);
		total += value.length;

		//100MB超えたら死ぬ
		if (total > 100 * 1024 * 1024) {
			reader.cancel();
			throw new Error("既定サイズを越えた");
		}
	}

	const result = new Uint8Array(total);
	let offset = 0;
	for (let i = 0; i < chunks.length; i++) {
		const chunk = chunks[i];
		result.set(chunk, offset);
		offset += chunk.length;
	}

	return result;
}

/**
 * URLから画像をロードします
 * @param {string} url URL
 * @returns Image
 */
async function get_image_from_url(url) {
	const data = await get_byte_from_url(url);
	const dataurl = unit8array_to_dataurl(data, "");

	return new Promise((resolve, reject) => {
		let img = new Image();
		img.src = dataurl;

		img.onload = () => resolve(img);
		img.onerror = reject;
	});
}

/**
 * URLから動画をロードします。
 * @param {string} url URL
 * @returns Video
 */
async function get_video_from_url(url) {
	const data = await get_byte_from_url(url);
	const dataurl = unit8array_to_dataurl(data, "");

	return new Promise((resolve, reject) => {
		let video = document.createElement("VIDEO");
		video.src = dataurl;
		video.preload = "metadata";

		video.onloadedmetadata = () => resolve(video);
		video.onerror = reject;
	});
}

/**
 * ファイルからデータをロードします。
 * @param {File} file ファイル
 * @returns ArrayBuffer
 */
async function get_dataurl_from_file(file) {
	return new Promise((resolve, reject) => {
		const r = new FileReader();
		r.onload = function (e) {
			resolve(e.target.result);
		};
		r.onerror = reject;
		r.readAsDataURL(file);
	});
}

async function gen_file_item(file) {
	let item = document.createElement("DIV");
	//item.id = "SEND_FILE_ITEM";
	item.className = "SEND_FILE_ITEM";

	let thumbnail = document.createElement("SPAN");
	thumbnail.className = "THUMBNAIL";
	switch(detect_file_type(file.type)) {
		case file_type_group.Image:
			const dataurl = await get_dataurl_from_file(file);
			thumbnail.innerHTML = `<IMG SRC="${dataurl}">`;
			break;

		case file_type_group.Video:
			thumbnail.innerHTML = "動画";
			break;

		default:
			thumbnail.innerHTML = "?";
			break;
	}

	let name = document.createElement("SPAN");
	name.className = "NAME";
	name.innerText = file.name;

	item.appendChild(thumbnail);
	item.appendChild(name);

	return item;
}