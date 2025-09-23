function LinkifyHTML(Data) {
	const Parser = new DOMParser();
	const Doc = Parser.parseFromString(Data, 'text/html');

	function ProcessNode(node) {
		if (node.nodeType === Node.TEXT_NODE) {
			const replaced = node.textContent.replace(
				/\b([a-zA-Z][a-zA-Z0-9+\-.]*:[^\s<]+)/g,
				url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
			);
			if (replaced !== node.textContent) {
				const span = document.createElement("span");
				span.innerHTML = replaced;
				node.replaceWith(...span.childNodes);
			}
		} else if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() !== 'a') {
			Array.from(node.childNodes).forEach(ProcessNode);
		}
	}

	Array.from(Doc.body.childNodes).forEach(ProcessNode);
	return Doc.body.innerHTML;
}