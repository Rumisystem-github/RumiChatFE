const file_type_group = {
	Other: "Other",
	Image: "Image",
	Video: "Video",
	Audio: "Audio"
};

function detect_file_type(mime_type) {
	if (mime_type.startsWith("image/")) {
		return file_type_group.Image;
	} else if (mime_type.startsWith("video/")) {
		return file_type_group.Video;
	} else if (mime_type.startsWith("audio/")) {
		return file_type_group.Audio;
	} else {
		return file_type_group.Other;
	}
}