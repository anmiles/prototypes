declare global {
	interface String {
		toUpperFirstLetter(): string;
		toLowerFirstLetter(): string;
		regexEscape(): string;
		htmlEscape(): string;
		urlEscape(): string;
	}
}

export {};

String.prototype.toUpperFirstLetter = function() {
	if (this.length === 0) {
		return this;
	}
	return this[0].toUpperCase() + this.substring(1, this.length);
};

String.prototype.toLowerFirstLetter = function() {
	if (this.length === 0) {
		return this;
	}
	return this[0].toLowerCase() + this.substring(1, this.length);
};

String.prototype.regexEscape = function() {
	return this.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
};

String.prototype.htmlEscape = function() {
	return this.replace(/[\u00A0-\u9999<>&]/gim, function(i: string) {
		return `&#${i.charCodeAt(0)};`;
	});
};

String.prototype.urlEscape = function() {
	return this.replace(/([^A-Za-z0-9]+)/gim, '-').toLowerCase();
};
