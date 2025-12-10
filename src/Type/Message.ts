export type MessageFile = {
	ID: string,
	TYPE: string,
	IS_TEXT: boolean,
	NSFW: boolean,
	URL: string
};

export type Message = {
	ID: string,
	CREATE_AT: string,
	TEXT: string
	FILE_LIST: MessageFile[]
};