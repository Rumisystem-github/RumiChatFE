import type { Group } from "./Group";
import type { Message } from "./Message";
import type { Room } from "./Room";
import type { User } from "./User";

export type SessionLoginResponse = {
	STATUS: boolean,
	CID: string,
	PERMISSION: string[],
	ACCOUNT_DATA: User,
	APP: string
};

export type GetGroupListResponse = {
	STATUS: boolean,
	LIST: Group[]
};

export type GetRoomListResponse = {
	STATUS: boolean,
	LIST: Room[]
};

export type GetMessageListResponse = {
	STATUS: boolean,
	LIST: {
		MESSAGE: Message,
		ACCOUNT: User
	}[]
};

export type SendMessageResponse = {
	STATUS: boolean
	FILE?: string[]
};