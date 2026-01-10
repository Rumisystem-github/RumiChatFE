import type { SessionLoginResponse } from "./Type/APIResponseType";
import type { User } from "./Type/User";

export type LoginResult = {
	status: boolean,
	token: string | null,
	user: User | null
};

export async function login(): Promise<LoginResult> {
	let token:string | null = null;
	document.cookie.split(";").forEach(row => {
		if (row.startsWith("SESSION=")) {
			token = row.substring(row.indexOf("=") + 1);
		}
	});

	if (token == null) {
		return {status: false, token: null, user: null};
	}

	let ajax = await fetch(`https://account.rumiserver.com/api/Session?ID=${token}`);
	const result = (await ajax.json()) as SessionLoginResponse;

	if (!result.STATUS) {
		return {status: false, token: null, user: null};
	}

	return {status: true, token: token, user: result.ACCOUNT_DATA};
}