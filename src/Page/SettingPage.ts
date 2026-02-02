import { update_setting } from "../API";
import { console_print, PREFIX_INFO } from "../Log";
import { mel, self_pgp_key, self_user, setting, token } from "../Main";
import * as openpgp from "openpgp";
import type { LoadSelfPGPKey } from "../Type/SelfPGPKeyType";

type Field = {
	name: string,
	description: string,
	type: "Bool" | "Text",
	key: string,
	pro: boolean
};

type Genre = {
	id: string,
	name: string,
	description: string,
	field: Field[],
	start_fn: ()=>void
};

const setting_table: Genre[] = [
	{
		id: "chat",
		name: "チャット",
		description: "チャットの設定を行います",
		field: [
			{
				name: "URLクリーナー",
				description: "URLクリーナーを使用するか",
				type: "Bool",
				key: "url_cleaner",
				pro: true
			},
			{
				name: "動画プレイヤーの音量を同期する",
				description: "全ての動画プレイヤーで音量を同期します",
				type: "Bool",
				key: "message_video_volume_all_sync",
				pro: false
			},
			{
				name: "動画プレイヤーの音量を保存する",
				description: "動画プレイヤーの音量を保存します",
				type: "Bool",
				key: "message_video_volume_save",
				pro: false
			}
		],
		start_fn: function(){}
	},
	{
		id: "pro",
		name: "高度な設定",
		description: "高度な設定を行います",
		field: [
			{
				name: "プロモード",
				description: "様々な機能が解禁されますが、ややこしいです",
				type: "Bool",
				key: "promode",
				pro: false
			}
		],
		start_fn: function(){}
	},
	{
		id: "encrypt",
		name: "暗号通信",
		description: "暗号通信に関する設定を行います",
		field: [],
		start_fn: function(){
			if (localStorage.getItem("SELF_PGP_KEY") == null) {
				let create_key_button = document.createElement("BUTTON");
				create_key_button.innerText = "暗号通信のセットアップ";
				mel.contents.setting.field.append(create_key_button);
				create_key_button.onclick = async function() {
					let passphrase = window.prompt("パスフレーズをどうぞ");;
					if (passphrase == null || passphrase == "") return;

					//TODO:生成にクソ時間かかるのでロード画面でも出す方が良いと思う
					const {privateKey, publicKey} = await openpgp.generateKey({
						type: "rsa",
						rsaBits: 4096,
						passphrase: passphrase,
						format: "armored",
						userIDs: [
							{
								name: self_user.ID,
								email: `${self_user.ID}@example.com`
							}
						]
					});

					//サーバーへ送信する前に署名を作る
					const now_date = new Date();
					const sign_message = `PublicKeySign!${self_user.ID}@rumiserver.com/${now_date.getFullYear()}-${now_date.getMonth() + 1}-${now_date.getDate()}`;
					const sign_key = await openpgp.decryptKey({
						privateKey: await openpgp.readPrivateKey({armoredKey: privateKey}),
						passphrase: passphrase
					});
					const sign = await openpgp.sign({
						message: await openpgp.createMessage({text: sign_message}),
						signingKeys: sign_key,
						detached: true
					});

					let ajax = await fetch("/api/Key/Public", {
						method: "POST",
						headers: {
							"Accept": "application/json",
							"Content-Type": "application/json",
							"TOKEN": token
						},
						body: JSON.stringify({
							"PUBLIC_KEY": publicKey,
							"SIGN": sign
						})
					});

					if ((await ajax.json())["STATUS"]) {
						localStorage.setItem("SELF_PGP_KEY", JSON.stringify({
							"PUBLIC": publicKey,
							"PRIVATE": privateKey,
							"PASSPHRASE": passphrase
						}));

						//TODO:成功時になんか出せ
						window.location.reload();
					} else {
						alert("エラー");
					}
				};

				//インポート
				let import_button = document.createElement("BUTTON");
				import_button.innerText = "インポート";
				mel.contents.setting.field.append(import_button);
				import_button.onclick = async function() {
					let input = document.createElement("INPUT") as HTMLInputElement;
					input.type = "file";
					input.click();
					input.onchange = async function() {
						if (input.files!.length == 0) return;
						const file = input.files![0]!;
						const buffer = await file.arrayBuffer();
						const binary = new Uint8Array(buffer);
						const key_list = await openpgp.readKeys({
							binaryKeys: binary
						});

						//鍵をインポート
						let json: LoadSelfPGPKey = {PUBLIC: "", PRIVATE: "", PASSPHRASE: null};
						for (const key of key_list) {
							if (key.isPrivate()) {
								//秘密鍵
								let armor:string;
								if (!key.isDecrypted()) {
									const passphrase = prompt(key.getKeyID() + "のパスフレーズをどうぞ");
									if (passphrase == null) return;
									const decrypted = await openpgp.decryptKey({
										privateKey: key,
										passphrase: passphrase
									});
									armor = decrypted.armor();
									json.PASSPHRASE = passphrase;
								} else {
									armor = key.armor();
								}
								json.PRIVATE = armor;
							} else {
								//公開鍵
								json.PUBLIC = key.armor();
							}
						}

						//登録
						localStorage.setItem("SELF_PGP_KEY", JSON.stringify(json));

						//再起動
						window.location.reload();
					};
				};
			} else {
				let export_button = document.createElement("BUTTON");
				export_button.innerText = "エクスポート";
				mel.contents.setting.field.append(export_button);
				export_button.onclick = async function() {
					//秘密鍵を暗号化
					const passphrase = prompt("パスフレーズをどうぞ");
					if (passphrase == null) return;
					const encrypted_private_key = await openpgp.encryptKey({privateKey: self_pgp_key.private_key!, passphrase: passphrase});

					//バイナリ化
					const public_binary = self_pgp_key.public_key!.write();
					const private_binary = encrypted_private_key.write();

					//gpg化
					const gpg = new Uint8Array(public_binary.length + private_binary.length);
					gpg.set(public_binary, 0);
					gpg.set(private_binary, public_binary.length);

					//ダウンロード
					const blob = new Blob([gpg], {type: "application/octet-stream"});
					const url = URL.createObjectURL(blob);
					const a = document.createElement("A") as HTMLAnchorElement;
					a.href = url;
					a.download = "rumichat-key-exported.gpg";
					a.click();
					URL.revokeObjectURL(url);
				};
			}
		}
	},
	{
		id: "info",
		name: "情報",
		description: "るみチャットについて",
		field: [],
		start_fn: function(){}
	}
];

export async function start(path: string) {
	mel.side.setting_list.replaceChildren();
	mel.contents.setting.field.replaceChildren();
	mel.contents.setting.title.innerText = "";
	mel.contents.setting.description.innerText = "";

	//ジャンル
	for (const genre of setting_table) {
		let genre_el = document.createElement("A") as HTMLAnchorElement;
		genre_el.href = "/setting/" + genre.id;
		genre_el.innerText = genre.name;
		mel.side.setting_list.append(genre_el);
	}

	//パスを見る
	const select = path.replace(/\/setting\/?/, "");
	if (select !== "") {
		const genre = setting_table.find((g)=>g.id === select);
		if (genre != null) {
			mel.contents.setting.title.innerText = genre.name;
			mel.contents.setting.description.innerText = genre.description;

			for (const field of genre.field) {
				if ((!setting.promode) && field.pro) continue;
				const key = field.key as keyof typeof setting;

				let field_el = document.createElement("DIV");
				mel.contents.setting.field.append(field_el);

				let name_el = document.createElement("DIV");
				name_el.innerText = field.name;
				field_el.append(name_el);

				let value_el = document.createElement("DIV");
				field_el.append(value_el);

				switch (field.type) {
					case "Bool":
						let checkbox = document.createElement("INPUT") as HTMLInputElement;
						checkbox.type = "checkbox";
						checkbox.className = "CheckboxSwitch";
						value_el.append(checkbox);
						checkbox.checked = setting[key];

						checkbox.onchange = function() {
							setting[key] = checkbox.checked;
							update(field.key, checkbox.checked);
						};
						break;
					case "Text":
						let input = document.createElement("INPUT") as HTMLInputElement;
						input.type = "text";
						value_el.append(input);
						break;
				}
			}

			genre.start_fn();
		} else {
			mel.contents.setting.title.innerText = "設定がありません。";
		}
	}

	mel.side.setting_list.style.display = "block";
	mel.contents.setting.parent.style.display = "block";
}

async function update(key: string, value: any) {
	let update = {};
	// @ts-ignore
	update["rc_" + key] = value;
	await update_setting(update);
}