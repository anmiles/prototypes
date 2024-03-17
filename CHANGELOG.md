# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [10.0.2](../../tags/v10.0.2) - 2024-03-17
### Changed
- Do not test fs.win32.recurse on non-Windows system that don't support backslash separators

## [10.0.1](../../tags/v10.0.1) - 2024-03-16
### Changed
- Use dedicated .eslintignore

## [10.0.0](../../tags/v10.0.0) - 2024-03-16
### Added
- `String.prototype.urlEscape` to support russian letters
- `Error.parse` to build Error instance from an object of unknown type
### Changed
- Update eslint config and raise minimum supported NodeJS version to match one in typescript-eslint plugin
- Update .npmignore
- Unify jest.config.js by removing redundant patterns and providing support for both ts and tsx

## [9.0.2](../../tags/v9.0.2) - 2024-01-30
### Changed
- Migrate to GitHub

## [9.0.1](../../tags/v9.0.1) - 2024-01-29
### Changed
- Explicitly specify ignores from .gitignore in .eslintrc.js

## [9.0.0](../../tags/v9.0.0) - 2024-01-19
### Changed
- Rename `ownKeys` to `typedKeys` and `ownEntries` to `typedEntries` in order to get rid of conflict with `Reflect.ownKeys` exposed by `ownKeys` property of class `Proxy`

## [8.1.0](../../tags/v8.1.0) - 2024-01-19
### Changed
- `Object.ownEntries` to get typed entries of an object

## [8.0.0](../../tags/v8.0.0) - 2024-01-19
### Changed
- Make `Object.ownKeys` type-safe by requiring set of keys

## [7.0.0](../../tags/v7.0.0) - 2024-01-14
### Changed
- Update project configurations
- Update dependencies

## [6.0.3](../../tags/v6.0.3) - 2024-01-02
### Changed
- Extract mockFS function to `@anmiles/extensions`

## [6.0.1](../../tags/v6.0.1) - 2024-01-01
### Changed
- Use named functions in prototypes and arrow functions in tests

## [6.0.0](../../tags/v6.0.0) - 2023-12-28
### Changed
- `fs.ensureDir` and `fs.ensureFile` return action result and do not throw if not exists

## [5.4.0](../../tags/v5.4.0) - 2023-12-28
### Added
- `fs.joinPath` joins two portions of file path using specified or default separator and return the path as typed as possible
### Changed
- `fs.joinPath` and `fs.recurse` are now separator-specific

## [5.3.2](../../tags/v5.3.2) - 2023-12-26
### Changed
- `Object.ownKeys` works with partial records

## [5.3.1](../../tags/v5.3.1) - 2023-12-26
### Changed
- `Object.fill` receives callback function that generates value

## [5.3.0](../../tags/v5.3.0) - 2023-12-26
### Added
- `Object.fill` to fill object with default values by keys

## [5.2.2](../../tags/v5.2.2) - 2023-12-25
### Added
- `Object.ownKeys` to get typed keys
### Changed
- Update dependencies

## [5.1.3](../../tags/v5.1.3) - 2023-11-12
### Changed
- Update dependencies

## [5.1.2](../../tags/v5.1.2) - 2023-11-12
### Changed
- Update dependencies

## [5.1.1](../../tags/v5.1.1) - 2023-11-12
### Changed
- Update dependencies

## [5.1.0](../../tags/v5.1.0) - 2023-10-08
### Added
- Support for `fs.promises`

## [5.0.0](../../tags/v5.0.0) - 2023-10-06
### Added
- Extension filter for `fs.recurse`

## [4.0.0](../../tags/v4.0.0) - 2023-09-13
### Changed
- Update dependencies with breaking changes

## [3.0.0](../../tags/v3.0.0) - 2023-09-13
### Added
- Useful strings for testing purposes
### Changed
- Cleaned up test strings and values
- `htmlEscape` now prefers some known html entities

## [2.3.0](../../tags/v2.3.0) - 2023-08-15
### Changed
- `fs.ensureDir` and `fs.ensureFile` now can be asked to throw if not exists

## [2.2.1](../../tags/v2.2.1) - 2023-08-11
### Added
- `fs.prototype.size` to get directory size

## [2.1.7](../../tags/v2.1.7) - 2023-08-11
### Changed
- Use Dirent type in `fs.recurse` to reduce functions calls

## [2.1.6](../../tags/v2.1.6) - 2023-08-05
### Changed
- Collapse excess dots

## [2.1.4](../../tags/v2.1.4) - 2023-08-05
### Changed
- Use regex unicode categories and specify ranges more precisely

## [2.1.3](../../tags/v2.1.3) - 2023-08-04
### Changed
- Multiple fixes for `String.prototype.toFilename`

## [2.1.0](../../tags/v2.1.0) - 2023-08-04
### Added
- `String.prototype.beautify` unifies similar special symbols
- `String.prototype.toFilename` converts string into a valid filename

## [2.0.2](../../tags/v2.0.2) - 2023-05-08
### Changed
- Use shared eslint config * explicitly specify ignorePatterns

## [2.0.1](../../tags/v2.0.1) - 2023-05-08
### Changed
- Remove BOM when reading back just written JSON

## [2.0.0](../../tags/v2.0.0) - 2023-05-08
### Changed
- Forwarding validation error for validateCallback in `fs.getJSON` and `fs.getJSONAsync`

## [1.1.0](../../tags/v1.1.0) - 2023-05-08
### Added
- Introduce `fs.ensureDir`, `fs.ensureFile`, `fs.getJSON`, `fs.getJSONAsync`

## [1.0.7](../../tags/v1.0.7) - 2023-05-07
### Changed
- Better types for `fs.readJSON` and `fs.writeJSON`

## [1.0.5](../../tags/v1.0.5) - 2023-05-07
### Changed
- Updated `@anmiles/eslint-config`
- Cleanup cSpell words

## [1.0.4](../../tags/v1.0.4) - 2023-05-07
### Changed
- Changed README formatting

## [1.0.3](../../tags/v1.0.2) - 2023-05-06
### Added
- Add usage examples

## [1.0.2](../../tags/v1.0.2) - 2023-05-06
### Changed
- Use shared eslint configuration

## [1.0.1](../../tags/v1.0.1) - 2023-05-06
### Changed
- Rephrased tests to use "should" verb

## [1.0.0](../../tags/v1.0.0) - 2023-05-05
### Added
- Added changelog and converted project to TS
