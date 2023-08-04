declare global {
	interface String {
		toUpperFirstLetter(): string;
		toLowerFirstLetter(): string;
		regexEscape(): string;
		htmlEscape(): string;
		urlEscape(): string;
		beautify(): string;
		toFilename(): string;
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

String.prototype.toFilename = function() {
	return this.beautify()
		.replace(/["/\\|]/g, '-') // replace slashes with hyphen
		.replace(/: /g, ' - ') // replace colon as word edge with hyphen
		.replace(/:/g, '-') // replace colon as not a word edge with hyphen
		.normalize('NFD').replace(/(?<![ИиЕе])[\u0300-\u036f]/g, '') // unify accents from latin characters
		.replace(/И\u0306/g, 'Й').replace(/и\u0306/g, 'й').replace(/Е\u0308/g, 'Ё').replace(/е\u0308/g, 'ё') // undo normalizing russian accents
		.replace(/["*?"<>]/g, ' ') // remove other forbidden symbols
		.replace(/[^ A-Za-zА-Яа-яЁё0-9~!@#$%^&()\-=_+№[]{};',\.]/g, '') // remove any other symbols
		.replace(/\.\.\./g, '') // strip ellipsis
		.replace(/[.]+/g, '.') // collapse multiple dots
		.replace(/[-]+/g, '-') // collapse multiple hyphens
		.replace(/\s+/g, ' ') // collapse multiple spaces
		.trim(); // remove leading and trailing spaces
};
