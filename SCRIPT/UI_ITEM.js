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
		${(function () {
			if (Message.FILE.length != 0) {
				let Body = `<DIV CLASS="FILE">`;
				for (let I = 0; I < Message.FILE.length; I++) {
					const File = Message.FILE[I];
					if (File.TYPE.startsWith("image/")) {
						Body += `
							<IMG SRC="${File.URL}" onclick="OpenFileView('${File.URL}');">
						`;
					} else if (File.TYPE.startsWith("video/")) {
						Body += `
							<VIDEO SRC="${File.URL}" controls></VIDEO>
						`;
					} else {
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

function LinkifyHTML(Data) {
	const Parser = new DOMParser();
	const Doc = Parser.parseFromString(Data, 'text/html');

	function ProcessNode(node) {
		if (node.nodeType === Node.TEXT_NODE) {
			const replaced = node.textContent.replace(
				/(https?:\/\/[^\s<]+)/gi,
				url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
			);
			if (replaced !== node.textContent) {
				const span = document.createElement("span");
				span.innerHTML = replaced;
				node.replaceWith(...span.childNodes);
			}
		} else if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() !== 'a') {
			Array.from(node.childNodes).forEach(ProcessNode);
		}
	}

	Array.from(Doc.body.childNodes).forEach(ProcessNode);
	return Doc.body.innerHTML;
}

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