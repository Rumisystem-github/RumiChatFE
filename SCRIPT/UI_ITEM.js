function GenGroupItem(Group, ACK) {
	if (ACK) {
		ACK = "true";
	} else {
		ACK = "false";
	}

	return `
		<DIV CLASS="GROUPITEM" data-id="${Group.ID}" data-ack="${ACK}" onclick="ClickGroupItem('${Group.ID}');">
			<DIV>${htmlspecialchars(Group.NAME)}</DIV>
		</DIV>
	`;
}

function GenRoomItem(Room, ACK) {
	if (ACK) {
		ACK = "true";
	} else {
		ACK = "false";
	}

	return `
		<A HREF="/chat/${Room.GID}/${Room.ID}" onclick="ChatMessagePage['${Room.ID}'] = 0;">
			<DIV CLASS="ROOMITEM" data-id="${Room.ID}" data-ack="${ACK}">${htmlspecialchars(Room.NAME)}</DIV>
		</A>
	`;
}

function GenDMItem(DM) {
	let ACK = "";
	if (DM.ACK) {
		ACK = "true";
	} else {
		ACK = "false";
	}

	return `
		<A HREF="/dm/${DM.ID}" onclick="ChatMessagePage['${DM.ID}'] = 0;">
			<DIV CLASS="ROOMITEM" data-id="${DM.ID}" data-uid="${DM.UID}" data-ack="${ACK}">
				<IMG CLASS="ICON_CIRCLE" SRC="https://account.rumiserver.com/api/Icon?ID=${DM.UID}" STYLE="width: 35px; height; 35px;">
				${htmlspecialchars(DM.NAME)}
			</DIV>
		</A>
	`;
}

async function GenMessageItem(Message, User) {
	let UserName = htmlspecialchars(User.NAME);
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

	return `
	<DIV CLASS="MESSAGEITEM">
		<DIV CLASS="USER">
			<IMG CLASS="ICON" SRC="https://account.rumiserver.com/api/Icon?ID=${User.ID}">
			<SPAN CLASS="NAME">${UserName}</SPAN>
			<SPAN CLASS="DATE">${format_datetime(Message.DATE)}秒</SPAN>
		</DIV>
		<DIV CLASS="TEXT">
			${Text.replaceAll("\n", "<BR>")}
		</DIV>
		${await (async function () {
			if (Message.FILE.length != 0) {
				let Body = `<DIV CLASS="FILE_LIST">`;

				//ファイルを順番にチェックする
				for (let I = 0; I < Message.FILE.length; I++) {
					const File = Message.FILE[I];
					try {
						switch(detect_file_type(File.TYPE)) {
							case file_type_group.Image:
								const img = await get_image_from_url(File.URL);
								const new_height = img.height * (400 / img.width);
								Body += gen_message_file_item(File.URL, `<IMG SRC="${File.URL}" onclick="OpenFileView('${File.URL}');" STYLE="height: ${new_height}px;">`);
								img.remove();
								break;

							case file_type_group.Video:
								Body += gen_message_file_item(File.URL, `<VIDEO SRC="${File.URL}" controls></VIDEO>`);
								break;

							default:
								const data = await get_byte_from_url(File.URL);

								//テキストファイルか？
								if (is_textfile(data)) {
									Body += gen_message_file_item(File.URL, `<TEXTAREA STYLE="widht: 100%; height: 500px" readonly>${new TextDecoder("UTF-8").decode(data)}</TEXTAREA>`);
								} else {
									Body += gen_message_file_item(File.URL, `バイナリ`);
								}
								break;
						}
					} catch(ex) {
						Body += gen_message_file_item(File.URL, `添付ファイル`);
					}
				}

				Body += `</DIV>`;
				return Body;
			} else {
				return "";
			}
		})()}
	</DIV>`;
}

function gen_message_file_item(url, contents) {
	return `
	<DIV CLASS="FILE_ITEM">
		<DIV CLASS="FILE">
			${contents}
		</DIV>
		<DIV CLASS="CONTROLE">
			<A HREF="${url}" download><BUTTON>DL</BUTTON></A>
		</DIV>
	</DIV>`;
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
	return `
		<DIV ID="SEND_FILE_ITEM" CLASS="SEND_FILE_ITEM">
			<SPAN CLASS="THUMBNAIL">
			${await (async function(){
				switch(detect_file_type(file.type)) {
					case file_type_group.Image:
						const dataurl = await get_dataurl_from_file(file);
						return `<IMG SRC="${dataurl}">`;

					case file_type_group.Video:
						return "動画";

					default:
						return "?";
				}
			})()}
			</SPAN>
			<SPAN CLASS="NAME">
				${file.name}
			</SPAN>
		</DIV>
	`;
}