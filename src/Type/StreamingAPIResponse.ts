import type { Message } from "./Message";
import type { User } from "./User";

export type HandshakeResponse = {
	STATUS: boolean,
	HEARTBEAT: number
};

export type EventReceive = {
	TYPE: "RECEIVE_MESSAGE"
};

export type ReveiveMessageEvent = {
	ROOM_ID: string,
	GROUP_ID: string | null,
	MESSAGE: Message,
	USER: User
};