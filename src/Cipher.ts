import * as openpgp from "openpgp";
import { self_pgp_key } from "./SelfKeyManager";

export async function encrypt_from_publickey(publickey: openpgp.PublicKey, text: string) {
	if (self_pgp_key.public_key == null) throw new Error("自分の鍵がない");

	const et = await openpgp.encrypt({
		message: await openpgp.createMessage({text: text}),
		encryptionKeys: [publickey, self_pgp_key.public_key]
	});

	return et;
}

export async function decrypt_from_self_privatekey(armor: string) {
	const encrypted = await openpgp.readMessage({armoredMessage: armor});
	const dt = await openpgp.decrypt({message: encrypted, decryptionKeys: [self_pgp_key.private_key!], format: "binary"});

	return dt.data;
}