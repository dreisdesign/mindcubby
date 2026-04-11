# Changelog

All notable changes to Rotater will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-11

### Changed
- Default model color: `steelblue` → `#aab8c8` (cool aluminum tone)
- Default background: `black` → `#0a0a12` (deep blue-black)
- Default elevation: `25°` → `28°` (more heroic viewing angle)
- Default frames: `72` → `144` (50% slower rotation speed)
- Metallic ambient: `0.15` → `0.18` (lifts shadow detail on dark faces)

## [0.1.0] - 2026-04-11

### Added
- Initial release
- STL loading via `numpy-stl` with `trimesh` fallback
- 360° rotation exported as animated GIF or MP4
- Blinn-Phong lighting with `flat`, `phong`, and `metallic` shading presets
- CLI flags: `--frames`, `--fps`, `--elevation`, `--color`, `--bg`, `--shading`, `--title`, `--out-file`, `--output`
