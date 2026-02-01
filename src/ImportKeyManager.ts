import * as openpgp from "openpgp";

import { get_public_key } from "./API";

let key_table = new Map<string, openpgp.PublicKey>();

export async function key_manager_init() {
	if (localStorage.getItem("IMPORT_PGP_KEY") == null) {
		localStorage.setItem("IMPORT_PGP_KEY", "{}");
	}

	const db = JSON.parse(localStorage.getItem("IMPORT_PGP_KEY")!);
	for (const user_id of Object.keys(db)) {
		const public_key = await openpgp.readKey({armoredKey: db[user_id]});
		key_table.set(user_id, public_key);
	}
}

export async function import_key(user_id: string) {
	const armor = await get_public_key(user_id);

	//読み込む
	const public_key = await openpgp.readKey({armoredKey: armor});

	key_table.set(user_id, public_key);

	//書き込み
	const db = JSON.parse(localStorage.getItem("IMPORT_PGP_KEY")!);
	db[user_id] = armor;
	localStorage.setItem("IMPORT_PGP_KEY", JSON.stringify(db));
}

export function is_imported(user_id: string): boolean {
	if (key_table.has(user_id)) {
		return true;
	} else {
		return false;
	}
}

export async function get_imported_key(user_id: string): Promise<openpgp.PublicKey> {
	if (is_imported(user_id)) {
		return key_table.get(user_id)!;
	} else {
		throw new Error("ない");
	}
}