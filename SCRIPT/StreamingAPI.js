let WS = null;
let FirstWSHandshake = true;

async function ConnectStreamingAPI() {
	return new Promise((resolve, reject) => {
		let L = null;
		let PingTimer = null;
		WS = new WebSocket("/api/ws?ENCODE=PLAIN");
		WS.binaryType = "arraybuffer";

		if (FirstWSHandshake) {
			L = LOAD_WAIT_PRINT("WebSocketに接続中");
		}

		WS.addEventListener("open", (e)=>{
			if (FirstWSHandshake) {
				LOAD_WAIT_STOP(L, "OK");
				L = LOAD_WAIT_PRINT("ストリーミングAPIのハンドシェイク");
			}

			RunStreamingCommand(["HELO", SESSION]).then((Return)=>{
				if (Return.STATUS) {
					//ping送信の設定
					PingTimer = setInterval(() => {
						RunStreamingCommand(["PING"]);
					}, Return.HEARTBEAT);

					if (FirstWSHandshake) {
						LOAD_WAIT_STOP(L, "OK");
					}

					//もう初回ではないことを設定
					FirstWSHandshake = false;

					//成功応答
					resolve();
				} else {
					//失敗応答
					reject();
				}
			});
		});

		WS.addEventListener("message", async (e)=>{
			const Body = JSON.parse(e.data);
			if (Body.TYPE != null) {
				console.log("受信", Body);

				switch (Body.TYPE) {
					//メッセージ受信
					case "RECEIVE_MESSAGE": {
						//今開いているルームの話じゃないなら無視
						if (OpenRoomID == Body.RID) {
							const Temp = ChatMessageListScrollBottom;

							EL.CONTENTS.MESSAGELIST.appendChild(await GenMessageItem(Body.MESSAGE, Body.USER));

							//一番下までスクロール
							if (Temp) {
								MessageListBottomScroll();
							}

							UpdateACK(OpenRoomID);
						}

						//開いていないグループなら未読マーク
						if (OpenGroupID != Body.GID) {
							let GroupItem = document.querySelector(`.GROUPITEM[data-id='${Body.GID}']`);
							if (GroupItem != null) {
								GroupItem.dataset.ack = "false";
							}
						} else {
							//開いているグループなら、開いていない部屋を未読にする
							let ChannelItem = document.querySelector(`.ROOMITEM[data-id='${Body.RID}']`);
							if (ChannelItem != null) {
								ChannelItem.dataset.ack = "false";
							}
						}
						return;
					}

					case "DELETE_MESSAGE": {
						//今開いているルームの話じゃないなら無視
						if (OpenRoomID == Body.RID) {
							document.querySelector(`.MESSAGEITEM[data-id="${Body.ID}"]`).remove();
						}
					}

					case "MESSAGE_ACK": {
							let ChannelItem = document.querySelector(`.ROOMITEM[data-id='${Body.RID}']`);
							if (ChannelItem != null) {
								ChannelItem.dataset.ack = "true";
							}

							if (document.querySelectorAll(`.ROOMITEM[data-ack='false']`).length == 0) {
								let GroupItem = document.querySelector(`.GROUPITEM[data-id='${OpenGroupID}']`);
								if (GroupItem != null) {
									GroupItem.dataset.ack = "true";
								}
							}
						return;
					}
				}
			}
		});

		WS.addEventListener("close", (e)=>{
			if (!FirstWSHandshake) {
				console.log("切断されました");
				//初期化
				clearInterval(PingTimer);
				//再接続処理
				ConnectStreamingAPI();
			}
		});
	})
}

async function RunStreamingCommand(CMD) {
	return new Promise((resolve, reject) => {
		const ID = self.crypto.randomUUID();

		function Receive(e) {
			const Body = JSON.parse(e.data);
			if (Body.REQUEST == ID) {
				resolve(Body);
				WS.removeEventListener("message", Receive);
			}
		}

		WS.addEventListener("message", Receive);
		WS.send(JSON.stringify([ID].concat(CMD)));
	})
}