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
- `String.prototype.regexEscape` - escape regular expression
- `String.prototype.htmlEscape` - escape HTML-sensitive string
- `String.prototype.urlEscape` - escape string to make it URL-safe

### Array

- `Array.prototype.unique` - remove duplicates from array
- `Array.prototype.equals` - compare two arrays item-by-item
- `Array.prototype.indexFieldOf` - indexOf by value of nested key
- `Array.prototype.sum` - sum all values in array
- `Array.prototype.sort` - sort array by values of nested keys in various directions

### fs

- `fs.readJSON` - read and parse JSON from file
- `fs.writeJSON` - write JSON to file
- `fs.readTSV` - read and parse TSV from file
- `fs.writeTSV` - write TSV to file
- `fs.recurse` - recursively traverse directory for specified depth and apply callbacks for files, directories and links

### process

- `process.start` - run process in Windows environment and optionally output stdout/stderr or process them with custom functions
