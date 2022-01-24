# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.6.5](https://github.com/alexkn/node-red-contrib-homeconnect/compare/v0.6.4...v0.6.5) (2022-01-24)

### [0.6.4](https://github.com/alexkn/node-red-contrib-homeconnect/compare/v0.6.3...v0.6.4) (2021-08-06)


### Bug Fixes

* Haid parameters renamed due to changed homeconnect api ([36244dc](https://github.com/alexkn/node-red-contrib-homeconnect/commit/36244dc3dccfea635b063b6922f3f6ce2daaf790)), closes [#46](https://github.com/alexkn/node-red-contrib-homeconnect/issues/46)

### [0.6.3](https://github.com/alexkn/node-red-contrib-homeconnect/compare/v0.6.2...v0.6.3) (2021-04-10)


### Bug Fixes

* **request:** report errors to runtime ([4e1190d](https://github.com/alexkn/node-red-contrib-homeconnect/commit/4e1190d122fd6bada39c4a6a9265fb09b3dcd868)), closes [#38](https://github.com/alexkn/node-red-contrib-homeconnect/issues/38)

### [0.6.2](https://github.com/alexkn/node-red-contrib-homeconnect/compare/v0.6.1...v0.6.2) (2021-02-19)


### Bug Fixes

* improve logging for request errors ([78f3c9a](https://github.com/alexkn/node-red-contrib-homeconnect/commit/78f3c9a7206abd480a7e766300b6c30f6943ff2a))

### [0.6.1](https://github.com/alexkn/node-red-contrib-homeconnect/compare/v0.6.0...v0.6.1) (2020-10-28)


### Bug Fixes

* remove deprecated events ([c2a4294](https://github.com/alexkn/node-red-contrib-homeconnect/commit/c2a42948c452518a4d64a08b9d93c55614d6d2e0)), closes [#18](https://github.com/alexkn/node-red-contrib-homeconnect/issues/18)

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
