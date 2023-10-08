# @anmiles/prototypes

Provides prototype extensions for native JS modules

----

## Installation
`npm install @anmiles/prototypes`

## Usage
### Number

- `Number.prototype.case` - select russian case of countable entity by count
- `Number.prototype.pad` - add leading or trailing zeros to number to fit specified number of digits

### String

- `String.prototype.toUpperFirstLetter` - make first letter uppercase
- `String.prototype.toLowerFirstLetter` - make first letter lowercase
- `String.prototype.htmlEscape` - escape HTML-sensitive string
- `String.prototype.urlEscape` - escape string to make it URL-safe
- `String.prototype.regexEscape` - escape regular expression
- `String.prototype.beautify` - unifies similar special symbols
- `String.prototype.toFilename` - converts string into a valid filename

### Array

- `Array.prototype.unique` - remove duplicates from array
- `Array.prototype.equals` - compare two arrays item-by-item
- `Array.prototype.indexFieldOf` - indexOf by value of nested key
- `Array.prototype.sum` - sum all values in array
- `Array.prototype.sort` - sort array by values of nested keys in various directions

### fs

- `fs.ensureDir` - check if dir exists and is directory; creates it or throws if not exists
- `fs.ensureFile` - check if file exists and is file; creates it or throws if not exists
- `fs.readJSON` - read and parse JSON from file
- `fs.writeJSON` - write JSON to file
- `fs.getJSON` - get JSON from file with falling back and validation
- `fs.getJSONAsync` - asynchronously get JSON from file with asynchronous falling back and asynchronous validation
- `fs.readTSV` - read and parse TSV from file
- `fs.writeTSV` - write TSV to file
- `fs.recurse` - recursively traverse directory for specified depth and apply callbacks for files (with optionally specified extension), directories and links
- `fs.size` - recursively calculates get directory size

### process

- `process.start` - run process in Windows environment and optionally output stdout/stderr or process them with custom functions

## Useful strings for testing purposes:

- string value
  - `begin  .-'``"~!@#$%^&*?:;,_=+/\|[]{}()<>&nbsp;&lt;&gt;²½áßÈіíž©§€₤∑א雨https://A-_/?b[c]&(1)end`
- query string value
  - `begin .-'``"~!@$%^*:;,_=+\|()[]{}<>²½áßÈіíž©§€₤∑א雨https://A-_/b[c](1)end`
- url
  - `https://example.com/begin.-'``"~!@#$%^&*?:;,_=+/\|()[]{}<>&nbsp;&lt;&gt;²½áßÈіíž©§€₤∑א雨end`
- email
  - `test.-'``~!#$%^&*?_=+/|{}&nbsp&lt&gtіž€₤∑א雨@example.com`
