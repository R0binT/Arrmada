# Changelog

All notable changes to Arrmada are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.5] - 2026-07-29

### Fixed

- ensure newline before appending Gradle CI properties (#51)
- reset movies/series/settings stacks when selecting their tabs (#48)

### Maintenance

- speed up Publish release by dropping SDK cache bloat (#47)

## [1.1.4] - 2026-07-28

### Added

- in-app update check from Settings About (#45)

## [1.1.3] - 2026-07-28

### Added

- rich media info with streaming-style detail and MediaQuick UI (#43)

## [1.1.2] - 2026-07-28

### Added

- show cast on detail pages and MediaQuick (#41)

### Maintenance

- bump dorny/paths-filter from 3 to 4 (#34)
- bump actions/setup-node from 4 to 7 (#32)
- bump actions/checkout from 4 to 7 (#31)
- bump actions/setup-java from 4 to 5 (#30)
- switch project license to PolyForm Noncommercial 1.0.0 (#40)
- cache Gradle and Android SDK for faster release APK builds. (#39)

## [1.1.1] - 2026-07-27

### Maintenance

- refresh README screenshots on current master UI. (#33)
- Polish home hero: shorter banner and clearer reason label. (#29)

## [1.1.0] - 2026-07-27

### Added

- dark-cinema design system and streaming polish (#25)
- add preview via MediaQuick on search (#23)
- show library status in add search (#21)

### Fixed

- avoid nested heredoc in prepare-release bump step (#27)
- stay on add screen after submit (#22)
- correct APK asset deletion by name instead of ID (#20)

### Maintenance

- prepare-release PR then publish APK on merge (#26)
- Add GitHub security policy for private vulnerability reports. (#24)
- Add GitHub Action to build APK locally and update release (#19)
- bump actions/setup-node from 4 to 7 (#12)
- bump actions/checkout from 4 to 7 (#11)
- bump github/codeql-action from 3 to 4 (#10)
- harden repo security and path-aware CI (#17)
- add Dependabot and CodeQL scanning (#9)
- add CODEOWNERS so required reviews target @R0binT (#8)
- soften GitHub Pages hero copy and release CTA (#7)
- add .env.example and document EXPO_PUBLIC Arr vars (#6)

## [1.0.1] - 2026-07-26

### Fixed

- redraw Arrmada SVG logo to match the PNG mark
- inline EXPO_PUBLIC Arr config with static process.env access
- apply UI size preference across app screens

### Maintenance

- Merge pull request #5 from R0binT/chore/v1.0.1-release
- bump version to 1.0.1 for public APK release
- Merge pull request #4 from R0binT/fix/arrmada-logo-svg-match-png
- Merge branch 'master' into fix/arrmada-logo-svg-match-png
- Merge pull request #3 from R0binT/fix/expo-public-env-inline
- Merge branch 'master' into fix/expo-public-env-inline
- Merge pull request #2 from R0binT/fix/ui-size-preference-propagation
- Merge pull request #1 from R0binT/docs/github-pages-landing
- Add GitHub Pages product landing under docs/

## [1.0.0] - 2026-07-26

### Maintenance

- Arrmada v1.0.0

[1.1.5]: https://github.com/R0binT/Arrmada/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/R0binT/Arrmada/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/R0binT/Arrmada/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/R0binT/Arrmada/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/R0binT/Arrmada/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/R0binT/Arrmada/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/R0binT/Arrmada/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/R0binT/Arrmada/releases/tag/v1.0.0
