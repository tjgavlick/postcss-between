# Changelog
This project adheres to [Semantic Versioning](http://semver.org/).

## [1.1.0] - 2022-03-04
### Changed
- Migrate to Postcss 8 plugin architecture

## [1.0.6] - 2021-11-02
### Changed
- Allow for npm versions > 6
- Bump deps to pass `npm audit`
- Remove "comment" field from package.json to make eslint happy

## [1.0.5] - 2021-03-30
### Changed
- Bumped deps to address security vulnerabilities; passes `npm audit` at time of writing

## [1.0.4] - 2019-11-16
### Changed
- Minimum Node version is now 8 due to dependencies' support

### Fixed
- No longer lists npm as a dependency (it's instead an engine), thus removing a lingering audit vulnerability. Now passes `npm audit` with 0 vulnerabilities

## [1.0.3] - 2019-11-02
### Fixed
- Used fixed https-proxy-agent as a dev dependency

## [1.0.2] - 2019-06-11
### Fixed
- Bumped dependency versions for `tar` and `fstream`. Now passes `npm audit` with 0 vulnerabilities

## [1.0.1] - 2018-11-05
### Fixed
- Bumped dependency versions to get away from a security vulnerability in `merge`

## [1.0.0] - 2018-06-07
- Stable API

## [0.2.1] - 2018-06-01
### Fixed
- Grouping test was overeager in matching certain elements and is now more accurate
- Default for `spaceUnrelatedRule` was incorrect in documentation

### Changed
- Users can now pass an empty array or falsy value for `headingCommentIdentifiers` in order to mark no comments as headings
- Improved performance of heading comment test

## [0.2.0] - 2018-05-29
### Added
- Spacing between different types of blocks is now user-configurable via the plugin options

### Fixed
- Related selectors are now matched more accurately

## [0.1.1] - 2018-05-25
### Fixed
- Between now respects the selector's initial indentation when creating new lines with `breakMultipleSelectors`

## [0.1.0] - 2018-05-25
### Added
- Added the option to break multiple selectors to new lines

### Fixed
- Selectors (after the first) within blocks were not respecting their initial indentation


## [0.0.1] - 2018-05-24
### Added
- Added the initial spacing functionality for this plugin
