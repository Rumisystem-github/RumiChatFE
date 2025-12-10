export type Badge = {
	TYPE: string
};

export type RenkeiAccount = {
	ID: string,
	DATE: string,
	UPDATE: string,
	PUBLIC: boolean,
	SERVICE: string,
	SERVICE_ICON: string,
	SERVICE_NAME: string,
	ACCOUNT_ID: string,
	ACCOUNT_NAME: string,
	ACCOUNT_URL: string
};

export type User = {
	ID: string,
	UID: string,
	NAME: string,
	DESCRIPTION: string,
	ICON: string,
	BADGE: Badge[],
	REGIST_DATE: string,
	OFFICIAL: boolean,
	PRIVATE: boolean,
	SEX: string,
	LOCATION: string,
	ACCOUNT_STATUS: string,
	RENKEI: RenkeiAccount[],
	FOLLOWED: number,
	FOLLOWER: number
};