const LocalStragePGPSelfItemKey = "SELF_PGP_KEY";
const LocalStragePGPImportItemKey = "IMPORT_PGP_KEY";
let SelfPGPKey = {
	Private: null,
	Public: null
};

async function OpenPGPMenu() {
	if (localStorage.getItem(LocalStragePGPSelfItemKey) != null) {
		document.getElementById("PGPMENU_NEW_KEY").style.display = "none";
		document.getElementById("PGPMENU_EXITS_KEY").style.display = "block";

		const KeyHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.parse(localStorage.getItem(LocalStragePGPSelfItemKey)).PUBLIC));
		document.getElementById("PGPMENU_KIRAKIRA").innerText = GenKiraKira(new Uint8Array(KeyHash));

		document.getElementById("PGPMENU_KEYLIST").querySelector("tbody").innerHTML = `
		<TR>
			<TH>ユーザー</TH>
			<TH>操作</TH>
		</TR>
		`;
		const KeyList = JSON.parse(localStorage.getItem(LocalStragePGPImportItemKey));
		for (let I = 0; I < Object.keys(KeyList).length; I++) {
			try {
				const UID = Object.keys(KeyList)[I];
				const User = await GetACCOUNT(UID);
				const Key = KeyList[UID];

				document.getElementById("PGPMENU_KEYLIST").querySelector("tbody").innerHTML += `
					<TR>
						<TD>${User.NAME}</TD>
						<TD><BUTTON>削除</BUTTON></TD>
					</TR>
				`;
			} catch (EX) {
				//スキップ
			}
		}
	}

	EL.PGPMENU.BG.style.display = "block";
	EL.PGPMENU.MAIN.style.display = "block";
}

async function ClosePGPMenu() {
	EL.PGPMENU.BG.style.display = "none";
	EL.PGPMENU.MAIN.style.display = "none";
}

async function DownloadSelfPGPKey() {
	if (localStorage.getItem(LocalStragePGPSelfItemKey) == null) return;
	const KeyData = JSON.parse(localStorage.getItem(LocalStragePGPSelfItemKey));
	const ASCData = KeyData.PUBLIC + "\n" +KeyData.PRIVATE;

	const b = new Blob([ASCData], {type: "application/pgp-keys"});
	const ObjectURL = URL.createObjectURL(b);

	const A = document.createElement("A");
	A.href = ObjectURL;
	A.download = "rumichat_key-" + ACCOUNT_DATA.UID + ".asc"
	A.click();

	URL.revokeObjectURL(ObjectURL);
}

async function ImportSelfPGPKey() {
	const InputElement = document.createElement("input");
	InputElement.type = "file";
	InputElement.accept = ".asc";
	InputElement.click();

	InputElement.addEventListener("change", (e)=>{
		const ASCFile = InputElement.files[0];

		const FR = new FileReader();
		FR.onload = async () => {
			const Data = FR.result;
			const ArmoredBlockList = Data.match(/-----BEGIN PGP (?:PUBLIC|PRIVATE) KEY BLOCK-----[^]*?-----END PGP (?:PUBLIC|PRIVATE) KEY BLOCK-----/g);
			let PublicKey = null;
			let PrivateKey = null;

			const PassPhrase =  await dialog.INPUT("パスフレーズをお願いします！", {"TYPE":"TEXT", "NAME": ""});
			if (PassPhrase == null) {
				dialog.DIALOG("キャンセルしました");
				InputElement.remove();
				return;
			}

			for (const Block of ArmoredBlockList) {
				const KeyList =  await openpgp.readKeys({ armoredKeys:Block });

				for (const Key of KeyList) {
					if (Key.isPrivate()) {
						PrivateKey = Block;

						try {
							await openpgp.decryptKey({
								privateKey: Key,
								passphrase: PassPhrase
							});
						} catch (EX) {
							dialog.DIALOG("パスフレーズが一致しませんでした");
							InputElement.remove();
							return;
						}
					} else {
						PublicKey = Block;
					}
				}
			}

			if (PublicKey == null || PrivateKey == null) {
				dialog.DIALOG("鍵が見つかりませんでした");
				InputElement.remove();
				return;
			}

			await RegistPGPKey(PrivateKey, PublicKey, PassPhrase);

			window.location.reload();
		};

		FR.onerror = () => {
			dialog.DIALOG("ASCファイルのロードに失敗しました（泣）");
			InputElement.remove();
		};

		FR.readAsText(ASCFile);
	});
}

async function SendPublicKeyToRoom() {
	if (localStorage.getItem(LocalStragePGPSelfItemKey) == null) return;
	const PublicKey = JSON.parse(localStorage.getItem(LocalStragePGPSelfItemKey)).PUBLIC;
	await SendMessage(OpenRoomID, PublicKey);
}

async function ImportPGPKey(UID) {
	InitImportPGPKeyTable();
	let ImportedPGPKeyTable = JSON.parse(localStorage.getItem(LocalStragePGPImportItemKey));

	try {
		//公開鍵を追加
		const PublicKeyText = await GetPGPPublicKey(UID);
		ImportedPGPKeyTable[UID] = {
			PUBLICKEY: [
				PublicKeyText
			]
		};
	} catch(EX) {
		//無視
	}

	//保存
	localStorage.setItem(LocalStragePGPImportItemKey, JSON.stringify(ImportedPGPKeyTable));

	//TODO:トーストを実装して出したほうが良いと思います！
}

function InitImportPGPKeyTable() {
	if (localStorage.getItem(LocalStragePGPImportItemKey) == null) {
		localStorage.setItem(LocalStragePGPImportItemKey, "{}")
	}
}

async function LoadPGPKey() {
	if (localStorage.getItem(LocalStragePGPSelfItemKey) != null) {
		const KeyData = JSON.parse(localStorage.getItem(LocalStragePGPSelfItemKey));
		let PassPhrase = KeyData.PASSPHRASE;

		if (PassPhrase == null) {
			PassPhrase = await dialog.INPUT("パスフレーズをお願いします！", {"TYPE":"TEXT", "NAME": ""});
			if (PassPhrase == null) {
				throw new Error("パスフレーズが入力されませんでした");
			}
		}

		SelfPGPKey.Private = await openpgp.decryptKey({
			privateKey: await openpgp.readPrivateKey({ armoredKey: KeyData.PRIVATE }),
			passphrase: PassPhrase
		});
		SelfPGPKey.Public = await openpgp.readKey({ armoredKey: KeyData.PUBLIC });

		document.getElementById("PGPMENU_GENKEY").style.display = "none";
		document.getElementById("PGPMENU_DELKEY").style.display = "block";

		let L = LOAD_WAIT_PRINT("インポートされた公開鍵を検証しています");

		InitImportPGPKeyTable();
		let ImportedPGPKeyTable = JSON.parse(localStorage.getItem(LocalStragePGPImportItemKey));
		const ImportKeyUIDList = Object.keys(ImportedPGPKeyTable);
		for (let I = 0; I < ImportKeyUIDList.length; I++) {
			const UID = ImportKeyUIDList[I];
			const Row = ImportedPGPKeyTable[UID];

			function ExtractPGPKey(Key) {
				return Key.replace(/-----BEGIN PGP PUBLIC KEY BLOCK-----/, "")
					.replace(/-----END PGP PUBLIC KEY BLOCK-----/, "")
					.trim()
					.split("\n")
					.filter(line => !line.startsWith("Comment:"))
					.join("");
			}

			try {
				const PGPKey = await GetPGPPublicKey(UID);

				if (ExtractPGPKey(PGPKey) == ExtractPGPKey(Row.PUBLICKEY[0])) {
					LOAD_PRINT("OK", UID + "の公開鍵をチェックしました。");
				} else {
					LOAD_PRINT("OK", UID + "の公開鍵がサーバーのものと一致しませんでした、インポートし直します。");
					ImportPGPKey(UID);
				}
			} catch(EX) {
				LOAD_PRINT("INFO", UID + "の公開鍵がサーバーにありません、無視します。");
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		}

		LOAD_WAIT_STOP(L, "OK");
	} else {
		document.getElementById("PGPMENU_DELKEY").style.display = "none";
	}
}

async function GenPGPKey() {
	const PassPhrase = await dialog.INPUT("パスフレーズをお願いします！", {"TYPE":"TEXT", "NAME": ""});
	if (PassPhrase == null) {
		return;
	}

	const Result = await openpgp.generateKey({
		type: "ecc",
		curve: "curve25519",
		userIDs: [{"name": ACCOUNT_DATA.UID, "email": `${ACCOUNT_DATA.ID}@rumiserver.com`}],
		passphrase: PassPhrase
	});

	SelfPGPKey.Private = await openpgp.decryptKey({
		privateKey: await openpgp.readPrivateKey({ armoredKey: Result.privateKey }),
		passphrase: PassPhrase
	});
	SelfPGPKey.Public = await openpgp.readKey({ armoredKey: Result.publicKey });

	if (!(await dialog.INPUT("鍵を生成しました。パスフレーズも保存しますか？", {"TYPE":"NONE"}))) {
		PassPhrase = null;
	}

	localStorage.setItem(LocalStragePGPSelfItemKey, JSON.stringify({
		PRIVATE: Result.privateKey,
		PUBLIC: Result.publicKey,
		PASSPHRASE: PassPhrase
	}));

	const KeyHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(Result.publicKey));
	const KiraKira = GenKiraKira(new Uint8Array(KeyHash));
	await dialog.DIALOG(`鍵の生成に成功しました！<BR><PRE>${KiraKira}</PRE>`);

	await RegistPGPKey(Result.privateKey, Result.publicKey, PassPhrase);

	window.location.reload();

	return true;
}

//Drunken Bishopというアルゴリズムで生成するらしい(https://rumi-room.net/etc/key_kirakira/)
function GenKiraKira(HashBytes) {
	const Width = 17;
	const Height = 9;
	const GridSize = Width * Height;
	const Grid = new Array(GridSize).fill(0);

	//スタート位置
	let X = Math.floor(Width / 2);
	let Y = Math.floor(Height / 2);

	const StartX = X;
	const StartY = Y;

	for (let I = 0; I < HashBytes.length; I++) {
		for (let J = 0; J < 4; J++) {
			const Dir = (HashBytes[I] >> (J * 2)) & 0b11;

			// 方向分岐: 00=左上, 01=右上, 10=左下, 11=右下
			if (Dir === 0 && X > 0 && Y > 0) {
				X--; Y--;
			} else if (Dir === 1 && X < Width - 1 && Y > 0) {
				X++; Y--;
			} else if (Dir === 2 && X > 0 && Y < Height - 1) {
				X--; Y++;
			} else if (Dir === 3 && X < Width - 1 && Y < Height - 1) {
				X++; Y++;
			}

			Grid[Y * Width + X]++;
		}
	}

	// 記号テーブル（OpenSSHに似せた）
	const SymbolList = [
		' ', '.', 'o', '+', '=', '*', 'B', 'O', 'X', '@', '%', '&', '#', '/', '^'
	];

	// 描画用グリッド
	let LineList = [];

	for (let Row = 0; Row < Height; Row++) {
		let Line = '';
		for (let Col = 0; Col < Width; Col++) {
			let IDX = Row * Width + Col;
			if (Col === StartX && Row === StartY) {
				Line += 'S'; // スタート地点
			} else if (Col === X && Row === Y) {
				Line += 'E'; // ゴール地点
			} else {
				const V = Grid[IDX];
				Line += V >= SymbolList.length ? SymbolList[SymbolList.length - 1] : SymbolList[V];
			}
		}
		LineList.push(Line);
	}

	// フレームと合体
	const FramedLines = ['+---[VISUAL]---+'];
	for (let L of LineList) {
		FramedLines.push(`|${L}|`);
	}
	FramedLines.push('+----------------+');

	return FramedLines.join('\n');
}


async function DeletePGPKey() {
	if (await dialog.INPUT("鍵を削除すると、今までE2EEで受信したメッセージが解読できなくなります。続行しますか？", {"TYPE":"NONE"})) {
		localStorage.removeItem(LocalStragePGPSelfItemKey);
		window.location.reload();
	}
}

async function EncryptText(Text, PublicKey) {
	const Encrypted = await openpgp.encrypt({
		message: await openpgp.createMessage({text: Text}),
		encryptionKeys: [PublicKey, SelfPGPKey.Public]
	});

	return Encrypted;
}

async function EncryptUint8Array(Byte, PublicKey) {
	const Encrypted = await openpgp.encrypt({
		message: await openpgp.createMessage({binary: Byte}),
		encryptionKeys: [PublicKey, SelfPGPKey.Public]
	});

	return Encrypted;
}

async function DecryptText(EncryptedText, PrivateKey) {
	const Decrypted = await openpgp.decrypt({
		message: await openpgp.readMessage({armoredMessage: EncryptedText}),
		decryptionKeys: PrivateKey
	});

	return Decrypted;
}

async function RegistPGPKey(PrivateKey, PublicKey, PassPhrase) {
	localStorage.setItem(LocalStragePGPSelfItemKey, JSON.stringify({
		PRIVATE: PrivateKey,
		PUBLIC: PublicKey,
		PASSPHRASE: PassPhrase
	}));

	await RegistPGPPublicKey(PublicKey);
}