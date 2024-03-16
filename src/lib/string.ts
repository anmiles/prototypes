declare global {
	interface String {
		toUpperFirstLetter(): string;
		toLowerFirstLetter(): string;
		htmlEscape(): string;
		urlEscape(): string;
		regexEscape(): string;
		beautify(): string;
		toFilename(): string;
	}
}

String.prototype.toUpperFirstLetter = function toUpperFirstLetter(this: string) {
	const firstLetter = this[0];

	if (!firstLetter) {
		return '';
	}

	return firstLetter.toUpperCase() + this.substring(1, this.length);
};

String.prototype.toLowerFirstLetter = function toLowerFirstLetter(this: string) {
	const firstLetter = this[0];

	if (!firstLetter) {
		return this;
	}
	return firstLetter.toLowerCase() + this.substring(1, this.length);
};

String.prototype.htmlEscape = function htmlEscape(this: string) {
	return this
		.replace(/&/gm, '&amp;')
		.replace(/\xa0/gm, '&nbsp;')
		.replace(/</gm, '&lt;')
		.replace(/>/gm, '&gt;')
		.replace(/[\u00a0-\u9999]/gim, function(i: string) {
			return `&#${i.charCodeAt(0)};`;
		});
};

String.prototype.urlEscape = function urlEscape(this: string) {
	const rus = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
	const lat = 'abvgdeejziyklmnoprstufhccss-y-eua';
	const num = '0123456789';

	return this.split(/\s+/g).map((str) => Array.from(str.toString().toLowerCase()).map((symbol) => {
		if (rus.includes(symbol)) {
			return lat[rus.indexOf(symbol)];
		}

		if (lat.includes(symbol) || num.includes(symbol)) {
			return symbol;
		}

		return '-';
	}).join('')).join('-').replace(/-+/g, '-').replace(/^-/, '').replace(/-$/, '');
};

String.prototype.regexEscape = function regexEscape(this: string) {
	return this.replace(/[.\-$^*?+\\/\\|[\]{}()]/g, '\\$&');
};

String.prototype.beautify = function beautify(this: string) {
	return this
		.replace(/([\s\u200b\u200c\xa0]|&nbsp;)+/g, ' ') // unify spaces
		.replace(/[\u2024\u3002]/g, '.') // unify dots
		.replace(/[\u2026]/g, '...') // unify ellipsis
		.replace(/[\xb7\xad\u2010-\u2015\u2022\u2212\u2e3a-\u2e3b\u30fb-\u30fc]/g, '-') // unify hyphens
		.replace(/[`’]/g, '\'') // unify apostrophes
		.replace(/[«»“”＂]/g, '"') // unify quotes
		.replace(/[\uff1a]/g, ':') // unify colons
		.replace(/\uff1f/g, '?') // unify question marks
		.replace(/\uff0a/g, '*') // unify asterisks
		.replace(/\u29f8/g, '/') // unify slashes
		.replace(/\u29f9/g, '\\') // unify backslashes
		.replace(/\uff5c/g, '|') // unify vertical slashes
		.replace(/[「【]/g, '[').replace(/[」】]/g, ']') // unify square brackets
		.replace('²', '2') // unify 2
		.replace('³', '3') // unify 3
		.replace('¼', '.25') // unify 1/4
		.replace('½', '.5') // unify 1/2
		.replace('¾', '.75') // unify 3/4
		.replace('ß', 'ss') // unify double S
		.replace(/\u0406/g, 'I') // unify I
		.replace(/\u0456/g, 'i') // unify i
	;
};

String.prototype.toFilename = function toFilename(this: string) {
	return this.beautify()
		.replace(/[/\\|]/g, '-') // replace slashes with hyphen
		.replace(/: /g, ' - ') // replace colon as word edge with hyphen
		.replace(/:/g, '-') // replace colon as not a word edge with hyphen
		.normalize('NFD').replace(/(?<![ИиЕе])[\u0300-\u036f]/g, '') // unify accents from latin characters
		.replace(/И\u0306/g, 'Й').replace(/и\u0306/g, 'й').replace(/Е\u0308/g, 'Ё').replace(/е\u0308/g, 'ё') // undo normalizing russian accents
		// remove \ufe0f
		.replace(/["*?<>]/g, ' ') // remove other forbidden symbols
		.replace(/[^\d\p{L}'\u0020-\u007e\u00a1-\u00ff\u2100-\u214f]/gu, '') // remove any other symbols
		.replace(/[-]+/g, '-') // collapse multiple hyphens
		.replace(/\s+/g, ' ') // collapse multiple spaces
		.replace(/\.\.\.[.]+/g, '...') // collapse dots after ellipsis
		.replace(/\.\.\./g, '\u2026').replace(/[.]+/g, '.').replace(/\u2026/g, '...') // collapse double dots
		.trim() // remove leading and trailing spaces
		.replace(/^\.+/g, '').replace(/\.+$/g, '') // remove leading and trailing dots
	;
};

export {};
