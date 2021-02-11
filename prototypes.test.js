var mocha = require('mocha');
var chai = require('chai');
var assert = chai.assert;
require('prototypes');

describe("prototypes", function() {
    describe("String.prototype.format", function() {
        it("returns itself if no arguments", function() {
            assert.equal('test'.format(), 'test');
        });
        it("assumes one argument as the only format value", function() {
            assert.equal('test{0}'.format(false), 'testfalse');
        });
        it("replaces non-existing arguments with empty", function() {
            assert.equal('test{0}{1}'.format(1), 'test1');
        });
        it("assumes one object as associative array of format values", function() {
            assert.equal('test{q}{n}{0}'.format({'q': 1, 0: '2', n: null}), 'test12');
        });
        it("assumes multiple arguments as array of format values", function() {
            assert.equal('test{0}{1}'.format(1, '2'), 'test12');
        });
        it("allows to escape curly bracket with the same curly bracket", function() {
            assert.equal('test{{{1}}}{2}'.format({1: '2', '2': 1}), 'test{2}1');
        });
    });
    
    describe("String.prototype.toUpperFirstLetter", function() {
        it("makes first letter uppercase", function() {
            assert.equal('test'.toUpperFirstLetter(), 'Test');
        });
        it("returns itself on empty string", function() {
            assert.equal(''.toUpperFirstLetter(), '');
        });
    });
    
    describe("String.prototype.toLowerFirstLetter", function() {
        it("makes first letter lowercase", function() {
            assert.equal('TEST'.toLowerFirstLetter(), 'tEST');
        });
        it("returns itself on empty string", function() {
            assert.equal(''.toLowerFirstLetter(), '');
        });
    });
    
    describe("String.prototype.repeat", function() {
        it("repeats a string several times", function() {
            assert.equal('test'.repeat(3), 'testtesttest');
        });
    });
    
    describe("String.prototype.regexEscape", function() {
        it("escapes the regular expression", function() {
            assert.equal('-/\\^$*+?.()|[]{}'.regexEscape(), '\\-\\/\\\\\\^\\$\\*\\+\\?\\.\\(\\)\\|\\[\\]\\{\\}');
        });
    });
    
    describe("String.prototype.htmlEscape", function() {
        it("escapes the html-sensitive string", function() {
            assert.equal('<test> & £ 香'.htmlEscape(), '&#60;test&#62; &#38; &#163; &#39321;');
        });
    });
    
    describe("String.prototype.urlEscape", function() {
        it("replaces all non-alphanumeric characters with hyphen and converts to lowercase", function() {
            assert.equal('HTML encoding - & < > \' " ; and also @ # $ % . ( ) ? [ ] { } \\ + ^ | * © § € ₤ &nbsp; &lt; &gt; 雨 É  ½ ∑ and so on א http://Z-._~/?#q[q]@!$&\'(4)*+,;=f123: end'.urlEscape(), 'html-encoding-and-also-nbsp-lt-gt-and-so-on-http-z-q-q-4-f123-end');
        });
    });
    
    describe("String.prototype.pad", function() {
        it("adds symbol to the string until it's equal required length", function() {
            assert.equal('test'.pad(6, '_'), 'test__');
        });
        it("adds multi-symbol string to the string until it's more than or equal required length", function() {
            assert.equal('test'.pad(9, '[]'), 'test[][][]');
        });
        it("adds symbol to the left", function() {
            assert.equal('test'.pad(6, '_', true), '__test');
        });
        it("does nothing if required length is smaller that length of string", function() {
            assert.equal('test'.pad(3, '+'), 'test');
        });
        it("uses space if no symbol specified", function() {
            assert.equal('test'.pad(8), 'test    ');
        });
        it("casts symbol to string if it's not a string", function() {
            assert.equal('test'.pad(8, 5), 'test5555');
        });
        it("adjusts string to length of another string if first arguments is that string", function() {
            assert.equal('test'.pad('another', '_'), 'test___');
        });
    });
    
    describe("Number.prototype.case", function() {
        it("uses zero case if the last digit of the number is 0 or more than 5", function() {
            assert.equal((0).case('дней', 'день', 'дня'), 'дней');
            assert.equal((20).case('дней', 'день', 'дня'), 'дней');
            assert.equal((5).case('дней', 'день', 'дня'), 'дней');
            assert.equal((26).case('дней', 'день', 'дня'), 'дней');
            assert.equal((109).case('дней', 'день', 'дня'), 'дней');
        });
        it("uses one case if the last digit of the number is 1", function() {
            assert.equal((1).case('дней', 'день', 'дня'), 'день');
            assert.equal((21).case('дней', 'день', 'дня'), 'день');
        });
        it("uses two case if the last digit of the number is between 2 and 4", function() {
            assert.equal((2).case('дней', 'день', 'дня'), 'дня');
            assert.equal((3).case('дней', 'день', 'дня'), 'дня');
            assert.equal((4).case('дней', 'день', 'дня'), 'дня');
            assert.equal((22).case('дней', 'день', 'дня'), 'дня');
            assert.equal((23).case('дней', 'день', 'дня'), 'дня');
            assert.equal((24).case('дней', 'день', 'дня'), 'дня');
        });
        it("uses zero case if two last digits of number are between 10 and 20", function() {
            assert.equal((11).case('дней', 'день', 'дня'), 'дней');
            assert.equal((112).case('дней', 'день', 'дня'), 'дней');
            assert.equal((13).case('дней', 'день', 'дня'), 'дней');
            assert.equal((114).case('дней', 'день', 'дня'), 'дней');
            assert.equal((15).case('дней', 'день', 'дня'), 'дней');
        });
        it("works with list of arguments", function() {
            assert.equal((0).case(['дней', 'день', 'дня']), 'дней');
            assert.equal((1).case(['дней', 'день', 'дня']), 'день');
            assert.equal((2).case(['дней', 'день', 'дня']), 'дня');;
        });
    });
    
    describe("Number.prototype.pad", function() {
        it("adds zeros to the left part until it's length is equal required", function() {
            assert.equal((100.5).pad(5), '00100.5');
        });
        it("adds zeros to the right part until it's length is equal required", function() {
            assert.equal((100.5).pad(0, 3), '100.500');
        });
        it("turns integer into fload if right zeros are required", function() {
            assert.equal((100).pad(4, 3), '0100.000');
        });
    });
    
    describe("Array.prototype.unique", function() {
        it("removing duplicates", function() {
            assert.deepEqual([1, '2', 3, '2', 1].unique(), [1, '2', 3]);
        });
        it("is type-sensitive", function() {
            assert.deepEqual([1, '2', 3, 2, 1].unique(), [1, '2', 3, 2]);
            assert.notDeepEqual([1, '2', 3, 2, 1].unique(), [1, '2', 3]);
        });
    });
    
    describe("Array.prototype.equals", function() {
        it("different length", function() {
            assert.deepEqual([1, '2', 3].equals([1, '2']), false);
        });
        it("different item", function() {
            assert.deepEqual([1, '2', 3].equals([1, '2', 4]), false);
            assert.deepEqual([1, '2', 3].equals([1, '2', '3']), false);
        });
        it("equal items", function() {
            assert.deepEqual([1, '2', 3].equals([1, '2', 3]), true);
        });
    });
    
    describe("Array.prototype.indexFieldOf", function() {
        it("search the array of objects for an object that's field equals to specified term", function() {
            assert.equal([{'a': 2}, {'a': 3}, {'a': 5}, {'a': 3}].indexFieldOf('a', 3), 1);
        });
        it("skips specified number of array elements", function() {
            assert.equal([{'a': 'b'}, {'a': 'c'}, {'a': 'd'}, {'a': 'c'}].indexFieldOf('a', 'c', 2), 3);
        });
        it("work with chain of fields", function() {
            assert.equal([{'a': {'n': true}}, {'b': 0}, {'a': {'n': false}}, {'a': {'n': true}}].indexFieldOf(['a', 'n'], false), 2);
        });
    });
    
    describe("Array.prototype.sum", function() {
        it("sum all values of array", function() {
            assert.equal([1, 2, 4, 8].sum(), 15);
        });
    });
    
    describe("Array.prototype.sort", function() {
        it("sorts array using default sort function if argument is function", function() {
            assert.deepEqual([1, 4, 6, 2, 5, 7].sort(function(a, b){
                if (a % 2 === 0 && b % 2 !== 0) return 1;
                if (a % 2 !== 0 && b % 2 === 0) return -1;
                return 0;
            }), [1, 5, 7, 4, 6, 2]);
        });
        it("sorts array alphabetically ascending if no arguments specified", function() {
            assert.deepEqual(['banana', 'orange', 'apple'].sort(), ['apple', 'banana', 'orange']);
        });
        it("sorts array alphabetically ascending if true specified", function() {
            assert.deepEqual(['banana', 'orange', 'apple'].sort(true), ['apple', 'banana', 'orange']);
        });
        it("sorts array alphabetically descending if false specified", function() {
            assert.deepEqual(['banana', 'orange', 'apple'].sort(false), ['orange', 'banana', 'apple']);
        });
        it("sorts array of objects", function() {
            assert.deepEqual([
                {'a': 4, 'b': 2},
                {'a': 2, 'b': 4},
                {'a': 3, 'b': 4},
                {'a': 2, 'b': 2}
            ].sort('b'), [
                {'a': 4, 'b': 2},
                {'a': 2, 'b': 2},
                {'a': 2, 'b': 4},
                {'a': 3, 'b': 4}
            ]);
        });
        it("sorts array of objects by multiple fields", function() {
            assert.deepEqual([
                {'a': 4, 'b': 2},
                {'a': 2, 'b': 4},
                {'a': 3, 'b': 4},
                {'a': 2, 'b': 2}
            ].sort('a', 'b'), [
                {'a': 2, 'b': 2},
                {'a': 2, 'b': 4},
                {'a': 3, 'b': 4},
                {'a': 4, 'b': 2}
            ]);
        });
        it("sorts array of objects by multiple fields with desc", function() {
            assert.deepEqual([
                {'a': 4, 'b': 2},
                {'a': 2, 'b': 4},
                {'a': 3, 'b': 4},
                {'a': 2, 'b': 2}
            ].sort({b: false}, 'a'), [
                {'a': 2, 'b': 4},
                {'a': 3, 'b': 4},
                {'a': 2, 'b': 2},
                {'a': 4, 'b': 2}
            ]);
        });
        it("sorts different cases without ignoreCase", function() {
            assert.deepEqual([
                {'a': 'D', 'b': 'b'},
                {'a': 'D', 'b': 'D'},
                {'a': 'c', 'b': 'd'},
                {'a': 'B', 'b': 'B'}
            ].sort({b: false}, {a: true}), [
                {'a': 'c', 'b': 'd'},
                {'a': 'D', 'b': 'b'},
                {'a': 'D', 'b': 'D'},
                {'a': 'B', 'b': 'B'},
            ]);
        });
        it("sorts different cases with ignoreCase", function() {
            assert.deepEqual([
                {'a': 'D', 'b': 'b'},
                {'a': 'D', 'b': 'D'},
                {'a': 'c', 'b': 'd'},
                {'a': 'B', 'b': 'B'}
            ].sort({b: false, ignoreCase: true}, {a: true}), [
                {'a': 'D', 'b': 'D'},
                {'a': 'c', 'b': 'd'},
                {'a': 'B', 'b': 'B'},
                {'a': 'D', 'b': 'b'},
            ]);
        });
        it("treats null as empty string with ignoreCase", function() {
            assert.deepEqual([
                {'a': 'D', 'b': 'b'},
                {'a': 'D', 'b': null},
                {'a': 'c', 'b': 'd'},
                {'a': 'B', 'b': 'B'}
            ].sort({b: false, ignoreCase: true}, {a: true}), [
                {'a': 'c', 'b': 'd'},
                {'a': 'B', 'b': 'B'},
                {'a': 'D', 'b': 'b'},
                {'a': 'D', 'b': null},
            ]);
        });
        it("use find and replace", function() {
            assert.deepEqual([
                {'a': 'four', 'b': 'two'},
                {'a': 'one', 'b': 'four'},
                {'a': 'three', 'b': 'three'},
                {'a': 'two', 'b': 'one'}
            ].sort({a: true, find: 'four', replace: 'three'}, 'b'), [
                {'a': 'one', 'b': 'four'},
                {'a': 'three', 'b': 'three'},
                {'a': 'four', 'b': 'two'},
                {'a': 'two', 'b': 'one'}
            ]);
        });
        it("treats null as empty string if find used", function() {
            assert.deepEqual([
                {'a': 'four', 'b': 'two'},
                {'a': 'one', 'b': 'four'},
                {'a': 'three', 'b': 'three'},
                {'a': null, 'b': 'one'}
            ].sort({a: true, find: 'four', replace: 'three'}, 'b'), [
                {'a': null, 'b': 'one'},
                {'a': 'one', 'b': 'four'},
                {'a': 'three', 'b': 'three'},
                {'a': 'four', 'b': 'two'},
            ]);
        });
    });
});