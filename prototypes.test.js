describe("prototypes", function() {
    describe("Array.prototype.unique", function() {
        it("removing duplicates", function() {
            assert.deepEqual([1, '2', 3, '2', 1].unique(), [1, '2', 3]);
        });
        it("is type-sensitive", function() {
            assert.deepEqual([1, '2', 3, 2, 1].unique(), [1, '2', 3, 2]);
            assert.notDeepEqual([1, '2', 3, 2, 1].unique(), [1, '2', 3]);
        });
    });
    
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
            assert.equal('Test'.toLowerFirstLetter(), 'test');
        });
        it("returns itself on empty string", function() {
            assert.equal(''.toLowerFirstLetter(), '');
        });
    });
    
    describe("Array.prototype.sum", function() {
        it("sum all values of array", function() {
            assert.equal([1, 2, 4, 8].sum(), 15);
        });
    });
    
    describe("documentClass.prototype.createElement", function() {
        it("appends nonce='wildapricot' for script tags created", function() {
            assert.equal(document.createElement('script').getAttribute('nonce'), 'wildapricot');
        });
        it("do not affect other tags", function() {
            assert.isNull(document.createElement('style').getAttribute('nonce'));
        });
    });
});