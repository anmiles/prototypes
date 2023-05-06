import '../string';

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

	describe('regexEscape', function() {
		it('should escape the regular expression', function() {
			expect('-/\\^$*+?.()|[]{}'.regexEscape()).toEqual('\\-\\/\\\\\\^\\$\\*\\+\\?\\.\\(\\)\\|\\[\\]\\{\\}');
		});
	});

	describe('htmlEscape', function() {
		it('should escape the html-sensitive string', function() {
			expect('<test> & £ 香'.htmlEscape()).toEqual('&#60;test&#62; &#38; &#163; &#39321;');
		});
	});

	describe('urlEscape', function() {
		it('should replace all non-alphanumeric characters with hyphen and converts to lowercase', function() {
			expect('HTML encoding - & < > \' " ; and also @ # $ % . ( ) ? [ ] { } \\ + ^ | * © § € ₤ &nbsp; &lt; &gt; 雨 É  ½ ∑ and so on א http://Z-._~/?#q[q]@!$&\'(4)*+,;=f123: end'.urlEscape()).toEqual('html-encoding-and-also-nbsp-lt-gt-and-so-on-http-z-q-q-4-f123-end');
		});
	});
});
