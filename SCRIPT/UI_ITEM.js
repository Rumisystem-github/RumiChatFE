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
				let Body = `<DIV CLASS="FILE">`;

				//ファイルを順番にチェックする
				for (let I = 0; I < Message.FILE.length; I++) {
					const File = Message.FILE[I];
					try {
						switch(File.TYPE) {
							case "image/png":
							case "image/jpeg":
							case "image/avif":
							case "image/bmp":
							case "image/webp":
							case "image/svg+xml":
							case "image/apng":
							case "image/gif":
								const img = await get_image_from_url(File.URL);
								const new_height = img.height * (400 / img.width);
								Body += `<IMG SRC="${File.URL}" onclick="OpenFileView('${File.URL}');" STYLE="height: ${new_height}px;">`;
								img.remove();
								break;

							case "video/mp4":
							case "video/mpeg":
							case "video/ogg":
							case "video/mp2t":
							case "video/webm":
							case "video/3gpp":
							case "video/x-msvideo":
								Body += `<VIDEO SRC="${File.URL}" controls></VIDEO>`;
								break;

							default:
								Body += `<A HREF="${File.URL}" download>添付ファイル</A>`;
								break;
						}
					} catch(ex) {
						Body += `
							<A HREF="${File.URL}" download>添付ファイル</A>
						`;
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

async function get_image_from_url(url) {
	return new Promise((resolve, reject) => {
		let img = new Image();
		img.src = url;

		img.onload = () => resolve(img);
		img.onerror = reject;
	});
}

async function get_video_from_url(url) {
	return new Promise((resolve, reject) => {
		let video = document.createElement("VIDEO");
		video.src = url;
		video.preload = "metadata";

		video.onloadedmetadata = () => resolve(video);
		video.onerror = reject;
	});
}
