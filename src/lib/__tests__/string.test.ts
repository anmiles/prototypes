import '../string';

const test = {
	stringValue      : 'begin  .-\'`"~!@#$%^&*?:;,_=+/\\|[]{}()<>&nbsp;&lt;&gt;²½áßÈіíž©§€₤∑א雨https://A-_/?b[c]&(1)end',
	queryStringValue : 'begin .-\'`"~!@$%^*:;,_=+\\|()[]{}<>²½áßÈіíž©§€₤∑א雨https://A-_/b[c](1)end',
	url              : 'https://example.com/begin.-\'`"~!@#$%^&*?:;,_=+/\\|()[]{}<>&nbsp;&lt;&gt;²½áßÈіíž©§€₤∑א雨end',
	email            : 'test.-\'`~!#$%^&*?_=+/|{}&nbsp&lt&gtіž€₤∑א雨@example.com',
};

const escapedHTML  = 'begin &nbsp;.-\'`"~!@#$%^&amp;*?:;,_=+/\\|[]{}()&lt;&gt;&amp;nbsp;&amp;lt;&amp;gt;&#178;&#189;&#225;&#223;&#200;&#1110;&#237;&#382;&#169;&#167;&#8364;&#8356;&#8721;&#1488;&#38632;https://A-_/?b[c]&amp;(1)end';
const escapedUrl   = 'begin-nbsp-lt-gt-https-a-b-c-1-end';
const escapedRegex = 'begin  \\.\\-\'`"~!@#\\$%\\^&\\*\\?:;,_=\\+\\/\\\\\\|\\[\\]\\{\\}\\(\\)<>&nbsp;&lt;&gt;²½áßÈіíž©§€₤∑א雨https:\\/\\/A\\-_\\/\\?b\\[c\\]&\\(1\\)end';

const testTextToBeautify = '\x20\x09\u200b\u200c\xa0&nbsp;\u2024\u3002...\u2026-\xb7\xad\u2010\u2011\u2012\u2013\u2014\u2015\u2022\u2212\u2e3a\u2e3b\u30fb\u30fc\x27\x60\u2019"\xab\xbb\u201c\u201d\uff02:\uff1a?\uff1f*\uff0a/\u29f8\x5c\u29f9|\uff5c[]\u300c\u300d\u3010\u3011\xb2\xb3\xbc\xbd\xbe\xdfI\u0406i\u0456';
const rawTextToBeautify  = ' 	​‌ &nbsp;․。...…-·­‐‑‒–—―•−⸺⸻・ー\'`’"«»“”＂:：?？*＊/⧸\\⧹|｜[]「」【】²³¼½¾ßIІiі';
const testTextToFilename = ' ...text  ​‌&nbsp;․。…-·­‐‑‒–—―•−⸺⸻・ー\'`’"«»“”..:：s/⧸\\⧹ |｜()[]「」【】²³¼½¾áßeéèiіížIIЙйЁё *＊?？<>a:b key: value ,!_@&#%+=°©👍💥😂首…';

const beautifiedText   = ' ........---------------\'\'\'""""""::??**//\\\\||[][][]23.25.5.75ssIIii';
const preparedFilename = 'text ...-\'\'\' .-s- -()[][][]23.25.5.75asseeeiiizIIЙйЁё a-b key - value ,!_@&#%+=°©首';

describe('src/lib/string', function() {
	describe('toUpperFirstLetter', function() {
		it('should make first letter uppercase', function() {
			expect('test'.toUpperFirstLetter()).toEqual('Test');
		});

		it('should return itself on empty string', function() {
			expect(''.toUpperFirstLetter()).toEqual('');
		});
	});

	describe('toLowerFirstLetter', function() {
		it('should make first letter lowercase', function() {
			expect('TEST'.toLowerFirstLetter()).toEqual('tEST');
		});

		it('should return itself on empty string', function() {
			expect(''.toLowerFirstLetter()).toEqual('');
		});
	});

	describe('htmlEscape', function() {
		it('should escape the html-sensitive string', function() {
			expect(test.stringValue.htmlEscape()).toEqual(escapedHTML);
		});
	});

	describe('urlEscape', function() {
		it('should replace all non-alphanumeric characters with hyphen and converts to lowercase', function() {
			expect(test.stringValue.urlEscape()).toEqual(escapedUrl);
		});
	});

	describe('regexEscape', function() {
		it('should escape the regular expression', function() {
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
