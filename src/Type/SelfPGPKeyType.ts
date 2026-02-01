import * as openpgp from "openpgp";

export type LoadSelfPGPKey = {
	PRIVATE: string,
	PUBLIC: string,
	PASSPHRASE: string | null
};

export type SelfPGPKey = {
	public_key: openpgp.PublicKey | null,
	private_key: openpgp.PrivateKey | null
};