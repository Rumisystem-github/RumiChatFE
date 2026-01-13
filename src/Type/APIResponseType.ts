import type { Group } from "./Group";
import type { Message } from "./Message";
import type { Room } from "./Room";
import type { User } from "./User";

export type GetUserResponse = {
	STATUS: boolean,
	ACCOUNT: User,
	BLOCK: boolean,
	BLOCKER: boolean,
	FOLLOW: boolean,
	FOLLOWER: boolean
};

export type SessionLoginResponse = {
	STATUS: boolean,
	CID: string,
	PERMISSION: string[],
	ACCOUNT_DATA: User,
	APP: string
};

export type FollowResponse = {
	STATUS: boolean
};

export type UnFollowResponse = {
	STATUS: boolean
};

export type GetGroupResponse = {
	STATUS: boolean,
	GROUP: Group
};

export type GetGroupListResponse = {
	STATUS: boolean,
	LIST: Group[]
};

export type GetRoomResponse = {
	STATUS: boolean,
	ROOM: Room
};

export type GetRoomListResponse = {
	STATUS: boolean,
	LIST: Room[]
};

export type GetDMListResponse = {
	STATUS: boolean,
	LIST: Room[]
};

export type CreateDMResponse = {
	STATUS: boolean,
	ID: string
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

export type DeleteMessageResponse = {
	STATUS: boolean
};

export type UpdateLastReadMessageResponse = {
	STATUS: boolean
};

export type GetInviteListResponse = {
	STATUS: boolean,
	LIST: User[]
};

export type EditInviteResponse = {
	STATUS: boolean
};

export type GetSettingResponse = {
	STATUS: boolean,
	SETTING: object
};

export type UpdateSettingResponse = {
	STATUS: boolean
};