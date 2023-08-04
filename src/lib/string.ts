declare global {
	interface String {
		toUpperFirstLetter(): string;
		toLowerFirstLetter(): string;
		regexEscape(): string;
		htmlEscape(): string;
		urlEscape(): string;
		beautify(): string;
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

String.prototype.beautify = function() {
	return this
		.replace(/([\s\xa0\u200b\u200c]|&nbsp;)+/g, ' ') // unify spaces
		.replace(/[\u2024\u3002]/g, '.') // unify dots
		.replace(/[\u2026]/g, '...') // unify ellipsis
		.replace(/[·\u00ad\u2010-\u2015\u2022\u2212\u2e3a-\u2e3b\u30fb-\u30fc]/g, '-') // unify hyphens
		.replace(/[`’]/g, '\'') // unify apostrophes
		.replace(/[«»“”]/g, '"') // unify quotes
		.replace(/[\uff1a]/g, ':') // unify colons
		.replace(/\u0406/g, 'I') // unify I
		.replace(/\u0456/g, 'i') // unify i
		.replace('ß', 'ss') // unify double S
		.replace('¼', '.25') // unify 1/4
		.replace('½', '.5') // unify 1/2
		.replace('¾', '.75') // unify 3/4
		.replace('²', '2') // unify 2
		.replace('³', '3'); // unify 3
};
