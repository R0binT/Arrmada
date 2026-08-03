# Changelog

All notable changes to Arrmada are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0](https://github.com/R0binT/Arrmada/compare/v1.5.0...v1.6.0) (2026-08-03)


### Added

* paginate TMDB add-search results on scroll ([#76](https://github.com/R0binT/Arrmada/issues/76)) ([88fe331](https://github.com/R0binT/Arrmada/commit/88fe331f2ce1dea0b240a4280d51ccdde2663b8f))


### Fixed

* **ci:** inject TMDB API key into release APK builds ([#75](https://github.com/R0binT/Arrmada/issues/75)) ([322249c](https://github.com/R0binT/Arrmada/commit/322249cb7f9290dc4ea290ff0dca3ee419f043f8))


### Maintenance

* **deps:** bump github/codeql-action from 4 to 4.37.4 ([#73](https://github.com/R0binT/Arrmada/issues/73)) ([ba864f9](https://github.com/R0binT/Arrmada/commit/ba864f9a347caa18797a160f04b261b4f81ff641))
* **deps:** bump googleapis/release-please-action from 4 to 5 ([#74](https://github.com/R0binT/Arrmada/issues/74)) ([df4c868](https://github.com/R0binT/Arrmada/commit/df4c86888bc75b6ca8eabcc5f68cf4cab6c00ff4))
* **deps:** bump gradle/actions from 4 to 6.2.0 ([#72](https://github.com/R0binT/Arrmada/issues/72)) ([6085f99](https://github.com/R0binT/Arrmada/commit/6085f99b00e918ac4ef8fc19eda4b69c895922ae))

## [1.5.0](https://github.com/R0binT/Arrmada/compare/v1.4.0...v1.5.0) (2026-08-02)


### Added

* TMDB-first franchise search on Add screens ([#69](https://github.com/R0binT/Arrmada/issues/69)) ([9d17a3e](https://github.com/R0binT/Arrmada/commit/9d17a3ef1b94039808ca16225ee7b57d2ab8b04a))

## [1.4.0](https://github.com/R0binT/Arrmada/compare/v1.3.2...v1.4.0) (2026-07-31)


### Added

* add pull-to-refresh on home, library, and queue ([#67](https://github.com/R0binT/Arrmada/issues/67)) ([c0f00a3](https://github.com/R0binT/Arrmada/commit/c0f00a38cac572b07b4264984057d8fd99e2d76e))


### Fixed

* scope season releases and refresh Downloads after search ([#66](https://github.com/R0binT/Arrmada/issues/66)) ([99f587c](https://github.com/R0binT/Arrmada/commit/99f587ca83dc42a8c78ac344b72abdb4ffbaef7b))

## [1.3.2](https://github.com/R0binT/Arrmada/compare/v1.3.1...v1.3.2) (2026-07-31)


### Fixed

* reliable add downloads and choose-release file picker ([#64](https://github.com/R0binT/Arrmada/issues/64)) ([004c90b](https://github.com/R0binT/Arrmada/commit/004c90b2545a5456f4d42addb42f7860c59b9af8))

## [1.3.1](https://github.com/R0binT/Arrmada/compare/v1.3.0...v1.3.1) (2026-07-30)


### Fixed

* validate Arr app on connection test and correct Sonarr port placeholder ([#62](https://github.com/R0binT/Arrmada/issues/62)) ([a6543bd](https://github.com/R0binT/Arrmada/commit/a6543bd850a46b1fe883f3921d10a1314b529526))


### Maintenance

* refresh README and GitHub Pages screenshot gallery ([#61](https://github.com/R0binT/Arrmada/issues/61)) ([e9e2bc3](https://github.com/R0binT/Arrmada/commit/e9e2bc338c729671e40d9e8601a8fab772640ef9))

## [1.3.0](https://github.com/R0binT/Arrmada/compare/v1.2.0...v1.3.0) (2026-07-29)


### Added

* episode detail page and media language chips ([#59](https://github.com/R0binT/Arrmada/issues/59)) ([ae4d2b1](https://github.com/R0binT/Arrmada/commit/ae4d2b1f423c510a7e805d178590b16ace02eadc))


### Fixed

* **ci:** chain APK publish after release-please and use v* tags ([#58](https://github.com/R0binT/Arrmada/issues/58)) ([a7226f0](https://github.com/R0binT/Arrmada/commit/a7226f01c127816cb929396e389c4ae9ed5bce97))

## [1.2.0](https://github.com/R0binT/Arrmada/compare/arrmada-v1.1.5...arrmada-v1.2.0) (2026-07-29)


### Added

* add preview via MediaQuick on search ([#23](https://github.com/R0binT/Arrmada/issues/23)) ([c42c935](https://github.com/R0binT/Arrmada/commit/c42c935e76b94b0d4243d89254d6e0dd4e00f0ef))
* **ci:** release-please, changelog, and commitlint ([#55](https://github.com/R0binT/Arrmada/issues/55)) ([8587847](https://github.com/R0binT/Arrmada/commit/8587847d1374ce94fdc76b5110715b7843fa4b63))
* in-app update check from Settings About ([#45](https://github.com/R0binT/Arrmada/issues/45)) ([e4aac44](https://github.com/R0binT/Arrmada/commit/e4aac447c1184413537d328c1b7f1fc9a4667e19))
* rich media info with streaming-style detail and MediaQuick UI ([#43](https://github.com/R0binT/Arrmada/issues/43)) ([dc8c01a](https://github.com/R0binT/Arrmada/commit/dc8c01a9ae378694f3e770a6b856b85423ff9cd5))
* show cast on detail pages and MediaQuick ([#41](https://github.com/R0binT/Arrmada/issues/41)) ([ab869d3](https://github.com/R0binT/Arrmada/commit/ab869d319a11e73fc86fe604cf11b638bb0d6c07))
* show library status in add search ([#21](https://github.com/R0binT/Arrmada/issues/21)) ([23c87f0](https://github.com/R0binT/Arrmada/commit/23c87f08764df30fe57fb314be02158a34db9f9e))
* smarter queue polling and clearer add feedback ([#56](https://github.com/R0binT/Arrmada/issues/56)) ([6140767](https://github.com/R0binT/Arrmada/commit/6140767fd95ad4e02e30b17b3e9ffac878b33393))
* **ui:** dark-cinema design system and streaming polish ([#25](https://github.com/R0binT/Arrmada/issues/25)) ([444214f](https://github.com/R0binT/Arrmada/commit/444214f5704b59837e4608f920e0854e3a1c2aa6))


### Fixed

* allow MediaQuick dismiss by dragging the sheet body ([#53](https://github.com/R0binT/Arrmada/issues/53)) ([31f5257](https://github.com/R0binT/Arrmada/commit/31f5257abb0822d37f3b07583bdc7257ace501de))
* apply UI size preference across app screens ([b7adf07](https://github.com/R0binT/Arrmada/commit/b7adf07d524a6118ffac1bb5d2d220bb70e547e4))
* **ci:** avoid nested heredoc in prepare-release bump step ([#27](https://github.com/R0binT/Arrmada/issues/27)) ([663925d](https://github.com/R0binT/Arrmada/commit/663925d3b2df9598ef0c007aa46e956581b948b7))
* **ci:** ensure newline before appending Gradle CI properties ([#51](https://github.com/R0binT/Arrmada/issues/51)) ([7b23deb](https://github.com/R0binT/Arrmada/commit/7b23deb1e4685364f1014b041cc3b1deb96013d2))
* contain Android tab bar press ripple within the bar ([#54](https://github.com/R0binT/Arrmada/issues/54)) ([d70fc25](https://github.com/R0binT/Arrmada/commit/d70fc250bb49cdfb0fda20302c7412cabc0c7e86))
* correct APK asset deletion by name instead of ID ([#20](https://github.com/R0binT/Arrmada/issues/20)) ([de7c5fc](https://github.com/R0binT/Arrmada/commit/de7c5fc9af810c0c2c585774c673ca27f120b0c5))
* inline EXPO_PUBLIC Arr config for release APKs ([03c0c83](https://github.com/R0binT/Arrmada/commit/03c0c83c26ca6474d1f3e4ed82e3dad2d7e8b518))
* inline EXPO_PUBLIC Arr config with static process.env access ([934b134](https://github.com/R0binT/Arrmada/commit/934b1343402aaff9d58e8b474f0dbe40abd0af02))
* propagate UI size preference across app surfaces ([72180a1](https://github.com/R0binT/Arrmada/commit/72180a1d45e6a48fcf48edbb57431e2f9c8c5fe4))
* redraw Arrmada SVG logo to match the PNG mark ([7c202e4](https://github.com/R0binT/Arrmada/commit/7c202e447d42dc1321d828cd04396c388967c1af))
* redraw Arrmada SVG logo to match the PNG mark ([381cb87](https://github.com/R0binT/Arrmada/commit/381cb874088be415e67f6cf99fbdca87d4e15e1d))
* reset movies/series/settings stacks when selecting their tabs ([#48](https://github.com/R0binT/Arrmada/issues/48)) ([ac1b180](https://github.com/R0binT/Arrmada/commit/ac1b180db5a515bdad496dfa610fe3bbb3ce0eaf))
* stay on add screen after submit ([#22](https://github.com/R0binT/Arrmada/issues/22)) ([1558f12](https://github.com/R0binT/Arrmada/commit/1558f1233a240ee377e65cfd720cc45c52f9c8a9))


### Maintenance

* add .env.example and document EXPO_PUBLIC Arr vars ([#6](https://github.com/R0binT/Arrmada/issues/6)) ([b3421dd](https://github.com/R0binT/Arrmada/commit/b3421ddd104383248f26767384d9d2d8465b5fdd))
* add CODEOWNERS so required reviews target @R0binT ([#8](https://github.com/R0binT/Arrmada/issues/8)) ([cfbda12](https://github.com/R0binT/Arrmada/commit/cfbda12d42f62c94a4c492b077a249f33c6aba9f))
* add Dependabot and CodeQL scanning ([#9](https://github.com/R0binT/Arrmada/issues/9)) ([82319af](https://github.com/R0binT/Arrmada/commit/82319af046141a659b8829fcaf3ac47e7a0714aa))
* Arrmada v1.0.0 ([b48b54f](https://github.com/R0binT/Arrmada/commit/b48b54fe9f79e2da3175ce58730d2545b0f45dae))
* bump version to 1.0.1 for public APK release ([35cc2f4](https://github.com/R0binT/Arrmada/commit/35cc2f488527f443b7420c60940d40dfcc95aad7))
* bump version to 1.0.1 for public APK release ([7bbee01](https://github.com/R0binT/Arrmada/commit/7bbee01d19f4e127451cc4baca0a65a3e7effe99))
* cache Gradle and Android SDK for faster release APK builds. ([#39](https://github.com/R0binT/Arrmada/issues/39)) ([3539768](https://github.com/R0binT/Arrmada/commit/3539768c812daf9930f6aa6e58bed5a4833b1dfe))
* **deps:** bump actions/checkout from 4 to 7 ([#11](https://github.com/R0binT/Arrmada/issues/11)) ([9684831](https://github.com/R0binT/Arrmada/commit/9684831eaf87e95c09b780488294597015ce46ce))
* **deps:** bump actions/checkout from 4 to 7 ([#31](https://github.com/R0binT/Arrmada/issues/31)) ([eeeb5e0](https://github.com/R0binT/Arrmada/commit/eeeb5e0b5a96e826461c5f5ae67ec852b048ce56))
* **deps:** bump actions/setup-java from 4 to 5 ([#30](https://github.com/R0binT/Arrmada/issues/30)) ([796b6b5](https://github.com/R0binT/Arrmada/commit/796b6b532b0fb2f56ba3b21c84502b7ee6e59980))
* **deps:** bump actions/setup-node from 4 to 7 ([#12](https://github.com/R0binT/Arrmada/issues/12)) ([20fe42b](https://github.com/R0binT/Arrmada/commit/20fe42b2a0f886a536bce8e6dc3eb9aa684a1987))
* **deps:** bump actions/setup-node from 4 to 7 ([#32](https://github.com/R0binT/Arrmada/issues/32)) ([69cc608](https://github.com/R0binT/Arrmada/commit/69cc60821cbe230812fb05c92832a7b98d404c9a))
* **deps:** bump dorny/paths-filter from 3 to 4 ([#34](https://github.com/R0binT/Arrmada/issues/34)) ([46e47f8](https://github.com/R0binT/Arrmada/commit/46e47f837525dfdcf652053bd77fdf6cf82c5405))
* **deps:** bump github/codeql-action from 3 to 4 ([#10](https://github.com/R0binT/Arrmada/issues/10)) ([437c143](https://github.com/R0binT/Arrmada/commit/437c143f612ec940228c1bd4e863808cc6230835))
* GitHub Pages product landing ([2a785f6](https://github.com/R0binT/Arrmada/commit/2a785f63986531c00af758a0779cd7ec29c9044e))
* harden repo security and path-aware CI ([#17](https://github.com/R0binT/Arrmada/issues/17)) ([d1653b3](https://github.com/R0binT/Arrmada/commit/d1653b3e670d1a1b22dc474db87dfacc2f146376))
* prepare-release PR then publish APK on merge ([#26](https://github.com/R0binT/Arrmada/issues/26)) ([9224848](https://github.com/R0binT/Arrmada/commit/922484840678909a92ede5046a11d8d4b37dd9d4))
* refresh README screenshots on current master UI. ([#33](https://github.com/R0binT/Arrmada/issues/33)) ([ae41ffd](https://github.com/R0binT/Arrmada/commit/ae41ffdb15ac74b31a3c35e9d0a7e840e6bef20d))
* soften GitHub Pages hero copy and release CTA ([#7](https://github.com/R0binT/Arrmada/issues/7)) ([2b959e7](https://github.com/R0binT/Arrmada/commit/2b959e713dcb5a5dc82583efcdb5305f6ab230ad))
* speed up Publish release by dropping SDK cache bloat ([#47](https://github.com/R0binT/Arrmada/issues/47)) ([51f8df8](https://github.com/R0binT/Arrmada/commit/51f8df8ebb48717b8d54c8c190ab676025cbd465))
* switch project license to PolyForm Noncommercial 1.0.0 ([#40](https://github.com/R0binT/Arrmada/issues/40)) ([2f91d00](https://github.com/R0binT/Arrmada/commit/2f91d00ea8218d1b8da38622d66071793528661d))

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
