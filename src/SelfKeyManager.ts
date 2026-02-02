import * as openpgp from "openpgp";
import type { LoadSelfPGPKey, SelfPGPKey } from "./Type/SelfPGPKeyType";
import { get_public_key } from "./API";
import { loading_print_info } from "./Loading";
import { self_user } from "./Main";

export let self_pgp_key: SelfPGPKey = {
	public_key: null,
	private_key: null
};

export async function load_self_key() {
	const self_key_json = localStorage.getItem("SELF_PGP_KEY");
	if (self_key_json != null){
		const self_key = JSON.parse(self_key_json) as LoadSelfPGPKey;

		//公開鍵をロード
		const public_key = await openpgp.readKey({armoredKey: self_key.PUBLIC});

		//秘密鍵をロード
		let private_key = await openpgp.readPrivateKey({armoredKey: self_key.PRIVATE});
		if (!private_key.isDecrypted()) {
			let passphrase;
			if (self_key.PASSPHRASE == null) {
				passphrase = prompt("パスフレーズ");
			}

			private_key = await openpgp.decryptKey({privateKey: await openpgp.readPrivateKey({armoredKey: self_key.PRIVATE}), passphrase: passphrase!});
		}

		self_pgp_key.public_key = public_key;
		self_pgp_key.private_key = private_key;
	} else {
		try {
			await get_public_key(self_user.ID);
			//TODO:鍵のインポートダイアログ
		} catch {
			loading_print_info("鍵はありません。");
		}
	}
}