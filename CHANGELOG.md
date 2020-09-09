# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.6.0](https://github.com/alexkn/node-red-contrib-homeconnect/compare/v0.5.1...v0.6.0) (2020-09-09)


### Features

* **event:** detect connection loss and reconnect ([7a8e23c](https://github.com/alexkn/node-red-contrib-homeconnect/commit/7a8e23cf36b7437aa8262206d1dbd15e1b8b77ca)), closes [#14](https://github.com/alexkn/node-red-contrib-homeconnect/issues/14)
* **event:** handle KEEP-ALIVE events ([a5a0a96](https://github.com/alexkn/node-red-contrib-homeconnect/commit/a5a0a965a2dbc8508240038d6be4c316c870a8ba))


### Bug Fixes

* **auth:** don't send scope if empty ([344e4d4](https://github.com/alexkn/node-red-contrib-homeconnect/commit/344e4d4c0befc8d1328ced3c48ee08fd55d457dc))

### [0.5.1](https://github.com/alexkn/node-red-contrib-homeconnect/compare/v0.5.0...v0.5.1) (2020-08-16)


### Bug Fixes

* handle errors in auth callback ([b05206d](https://github.com/alexkn/node-red-contrib-homeconnect/commit/b05206dd0fde2573f01fd4257f743ef4afd600a0))

## [0.5.0] - 2020-07-10

### Added

* configurable authorization callback_url

## [0.4.2] - 2020-02-17

### Changed

* update dependencies
* package cleanup

## [0.4.1] - 2019-12-30

### Fixed

* refresh timer does not start

## [0.4.0] - 2019-12-29

First release to npm from repository alexkn/node-red-contrib-homeconnect

### Added

* home-connect-event node

### Changed

* refactored home-connect-auth to config node

* many small changes...
