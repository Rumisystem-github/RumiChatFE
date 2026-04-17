import * as pgp from "openpgp";

const data = JSON.parse(localStorage.getItem("SELF_PGP_KEY")!);

window.addEventListener("load", async ()=>{
	const session = new URLSearchParams(window.location.search).get("SESSION");
	if (session == null) {
		document.body.innerText = "るみさーばーの暗号化システムが作り直されたため、鍵移行が必要です。\nしなかった場合、暗号化していたDMなどが読めなくなります。\n秘密鍵の後に公開鍵を移行してください。\n";

		if (localStorage.getItem("KEY_MIG_PRIVATE") == null) {
			let btn = document.createElement("BUTTON");
			btn.innerText = "秘密鍵を移行する";
			btn.onclick = function() {
				localStorage.setItem("KEY_MIG_PRIVATE", "OK");
				window.location.href = `https://encrypt.rumiserver.com/regist.html?SESSION=${crypto.randomUUID()}&TYPE=PRIVATE&CALLBACK=` + encodeURIComponent("https://chat.rumiserver.com/");
			};
			document.body.append(btn);
		} else if (localStorage.getItem("KEY_MIG_PUBLIC") == null) {
			let btn = document.createElement("BUTTON");
			btn.innerText = "公開鍵を移行する";
			btn.onclick = function() {
				localStorage.setItem("KEY_MIG_PUBLIC", "OK");
				window.location.href = `https://encrypt.rumiserver.com/regist.html?SESSION=${crypto.randomUUID()}&TYPE=PUBLIC&CALLBACK=` + encodeURIComponent("https://chat.rumiserver.com/");
			};
			document.body.append(btn);
		} else {
			document.body.innerText = "るみの次回作にご期待ください(？)\n";
		}
	} else {
		const public_armored = data.PUBLIC;
		const private_armored = data.PRIVATE;
		//const passphrase = data.PASSPHRASE;

		let url;
		let key_data;
		let key_name;
		if (localStorage.getItem("KEY_MIG_PUBLIC") == null) {
			//秘密鍵
			url = "https://encrypt.rumiserver.com/api/Key/Private";
			const private_key = await pgp.readPrivateKey({ armoredKey: private_armored });
			key_data = btoa(String.fromCharCode(...private_key.write()));
			key_name = "CHAT_PRIVATE";
		} else {
			url = "https://encrypt.rumiserver.com/api/Key/Public";
			const public_key = await pgp.readKey({ armoredKey: public_armored });
			key_data = btoa(String.fromCharCode(...public_key.write()));
			key_name = "CHAT_PUBLIC";
		}

		let ajax = await fetch(url, {
			method: "PATCH",
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				"SESSION": session,
				"NAME": key_name,
				"KEY": key_data
			})
		});
		const result = await ajax.json();
		if (!result.STATUS) {
			alert("エラー");
		}

		window.location.href = "index.html?a";
	}
});