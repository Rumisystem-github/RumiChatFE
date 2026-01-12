import { update_setting } from "../API";
import { mel, setting } from "../Main";

type Field = {
	name: string,
	description: string,
	type: "Bool" | "Text",
	key: string,
	pro: boolean
};

type Genre = {
	id: string,
	name: string,
	description: string,
	field: Field[]
};

const setting_table: Genre[] = [
	{
		id: "chat",
		name: "チャット",
		description: "チャットの設定を行います",
		field: [
			{
				name: "URLクリーナー",
				description: "URLクリーナーを使用するか",
				type: "Bool",
				key: "url_cleaner",
				pro: true
			}
		]
	},
	{
		id: "pro",
		name: "高度な設定",
		description: "高度な設定を行います",
		field: [
			{
				name: "プロモード",
				description: "様々な機能が解禁されますが、ややこしいです",
				type: "Bool",
				key: "promode",
				pro: false
			}
		]
	},
	{
		id: "info",
		name: "情報",
		description: "るみチャットについて",
		field: []
	}
];

export async function start(path: string) {
	mel.side.setting_list.replaceChildren();
	mel.contents.setting.field.replaceChildren();
	mel.contents.setting.title.innerText = "";
	mel.contents.setting.description.innerText = "";

	//ジャンル
	for (const genre of setting_table) {
		let genre_el = document.createElement("A") as HTMLAnchorElement;
		genre_el.href = "/setting/" + genre.id;
		genre_el.innerText = genre.name;
		mel.side.setting_list.append(genre_el);
	}

	//パスを見る
	const select = path.replace(/\/setting\/?/, "");
	if (select !== "") {
		const genre = setting_table.find((g)=>g.id === select);
		if (genre != null) {
			mel.contents.setting.title.innerText = genre.name;
			mel.contents.setting.description.innerText = genre.description;

			for (const field of genre.field) {
				if ((!setting.promode) && field.pro) continue;
				const key = field.key as keyof typeof setting;

				let field_el = document.createElement("DIV");
				mel.contents.setting.field.append(field_el);

				let name_el = document.createElement("DIV");
				name_el.innerText = field.name;
				field_el.append(name_el);

				let value_el = document.createElement("DIV");
				field_el.append(value_el);

				switch (field.type) {
					case "Bool":
						let checkbox = document.createElement("INPUT") as HTMLInputElement;
						checkbox.type = "checkbox";
						checkbox.className = "CheckboxSwitch";
						value_el.append(checkbox);
						checkbox.checked = setting[key];

						checkbox.onchange = function() {
							setting[key] = checkbox.checked;
							update(field.key, checkbox.checked);
						};
						break;
					case "Text":
						let input = document.createElement("INPUT") as HTMLInputElement;
						input.type = "text";
						value_el.append(input);
						break;
				}
			}
		} else {
			mel.contents.setting.title.innerText = "設定がありません。";
		}
	}

	mel.side.setting_list.style.display = "block";
	mel.contents.setting.parent.style.display = "block";
}

async function update(key: string, value: any) {
	let update = {};
	// @ts-ignore
	update["rc_" + key] = value;
	await update_setting(update);
}