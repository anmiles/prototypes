import '../string';

const test = {
	stringValue     : 'begin ёЁ жЖ  .-\'`"~!@#$%^&*?:;,_=+/\\|()[]{}<>&nbsp;&lt;&gt;%27²½áßÈіíž©§€₤∑א雨https://A-_/?b[c]&(1)end',
	queryStringValue: 'begin ёЁ жЖ .-\'`"~!@$%^*:;,_=+\\|()[]{}<>%27²½áßÈіíž©§€₤∑א雨https://A-_/b[c](1)end',
	url             : 'https://example.com/beginёЁжЖ.-\'`"~!@#$%^&*?:;,_=+/\\|()[]{}<>&nbsp;&lt;&gt;%27²½áßÈіíž©§€₤∑א雨end',
	email           : 'test.-\'`~!#$%^&*?_=+/|{}&nbsp&lt&gt%27іž€₤∑א雨@example.com',
};

const escapedHTML  = 'begin &#1105;&#1025; &#1078;&#1046; &nbsp;.-\'`"~!@#$%^&amp;*?:;,_=+/\\|()[]{}&lt;&gt;&amp;nbsp;&amp;lt;&amp;gt;%27&#178;&#189;&#225;&#223;&#200;&#1110;&#237;&#382;&#169;&#167;&#8364;&#8356;&#8721;&#1488;&#38632;https://A-_/?b[c]&amp;(1)end';
const escapedUrl   = 'begin-ee-jj-nbsp-lt-gt-27-https-a-b-c-1-end';
const escapedRegex = 'begin ёЁ жЖ  \\.\\-\'`"~!@#\\$%\\^&\\*\\?:;,_=\\+\\/\\\\\\|\\(\\)\\[\\]\\{\\}<>&nbsp;&lt;&gt;%27²½áßÈіíž©§€₤∑א雨https:\\/\\/A\\-_\\/\\?b\\[c\\]&\\(1\\)end'; // eslint-disable-line @stylistic/max-len

const testTextToBeautify = '\u0451\u0401\x20\u0436\u0416\x20\x09\u200b\u200c\xa0&nbsp;%27\u2024\u3002...\u2026-\xb7\xad\u2010\u2011\u2012\u2013\u2014\u2015\u2022\u2212\u2e3a\u2e3b\u30fb\u30fc\x27\x60\u2019"\xab\xbb\u201c\u201d\uff02:\uff1a?\uff1f*\uff0a/\u29f8\x5c\u29f9|\uff5c[]\u300c\u300d\u3010\u3011\xb2\xb3\xbc\xbd\xbe\xdfI\u0406i\u0456'; // eslint-disable-line @stylistic/max-len
const rawTextToBeautify  = 'ёЁ жЖ 	​‌ &nbsp;%27․。...…-·­‐‑‒–—―•−⸺⸻・ー\'`’"«»“”＂:：?？*＊/⧸\\⧹|｜[]「」【】²³¼½¾ßIІiі';
const testTextToFilename = ' ...text ёЁ жЖ  ​‌&nbsp;%27․。…-·­‐‑‒–—―•−⸺⸻・ー\'`’"«»“”..:：s/⧸\\⧹ |｜()[]「」【】²³¼½¾áßeéèiіížIIЙйЁё *＊?？<>a:b key: value ,!_@&#%+=°©👍💥😂首…'; // eslint-disable-line @stylistic/max-len

const beautifiedText   = 'ёЁ жЖ %27........---------------\'\'\'""""""::??**//\\\\||[][][]23.25.5.75ssIIii';
const preparedFilename = 'text ёЁ жЖ %27...-\'\'\' .-s- -()[][][]23.25.5.75asseeeiiizIIЙйЁё a-b key - value ,!_@&#%+=°©首';

describe('src/lib/string', () => {
	describe('toUpperFirstLetter', () => {
		it('should make first letter uppercase', () => {
			expect('test'.toUpperFirstLetter()).toEqual('Test');
		});

		it('should return itself on empty string', () => {
			expect(''.toUpperFirstLetter()).toEqual('');
		});
	});

	describe('toLowerFirstLetter', () => {
		it('should make first letter lowercase', () => {
			expect('TEST'.toLowerFirstLetter()).toEqual('tEST');
		});

		it('should return itself on empty string', () => {
			expect(''.toLowerFirstLetter()).toEqual('');
		});
	});

	describe('htmlEscape', () => {
		it('should escape the html-sensitive string', () => {
			expect(test.stringValue.htmlEscape()).toEqual(escapedHTML);
		});
	});

	describe('urlEscape', () => {
		it('should replace all non-alphanumeric characters with hyphen and converts to lowercase', () => {
			expect(test.stringValue.urlEscape()).toEqual(escapedUrl);
		});

		it('should transliterate all cyrillic characters', () => {
			expect(test.stringValue.urlEscape()).toEqual(escapedUrl);
		});
	});

	describe('regexEscape', () => {
		it('should escape the regular expression', () => {
			expect(test.stringValue.regexEscape()).toEqual(escapedRegex);
		});
	});

	describe('beautify', () => {
		it('should be tested against correct raw text', () => {
			expect(rawTextToBeautify).toEqual(testTextToBeautify);
		});

		it('should beautify text by unifying similar special characters', () => {
			expect(rawTextToBeautify.beautify()).toEqual(beautifiedText);
		});
	});

	describe('toFilename', () => {
		it('should cleanup text for using as a filename', () => {
			expect(testTextToFilename.toFilename()).toEqual(preparedFilename);
		});
	});
});
