# Between [![Build Status](https://travis-ci.org/tjgavlick/postcss-between.svg?branch=master)](https://travis-ci.org/tjgavlick/postcss-between) [![npm version](https://badge.fury.io/js/postcss-between.svg)](https://badge.fury.io/js/postcss-between)

[PostCSS] plugin that handles spacing between blocks for a more readable stylesheet.

Between will only affect the spaces between blocks; selector and in-rule formatting/ordering will remain untouched. Use it as the mastering to [perfectionist](https://www.npmjs.com/package/perfectionist)'s mixing, for example.

- [Usage](#usage)
- [Options](#options)
- [Examples](#examples)

## Usage

```bash
npm install postcss-between
```

```js
const between = require('postcss-between');
postcss([
  between({
    // options
  })
]);
```

Use with Node 8 or greater. See [PostCSS] docs for examples for your environment.

## Options

### Spacing

Types: `int`

The amount of spacing between different combinations of blocks is adjustable using these options. Each value corresponds to the number of blank lines that will be baked out at the given points.

| Option | Default | Description |
| --- | --- | --- |
| **spaceRelatedRule** | `0` | rule + related rule; e.g. `.foo { }` followed by `.foo a { }` |
| **spaceUnrelatedRule** | `1` | rule + unrelated rule; e.g. `.foo { }` followed by `.bar { }` |
| **spaceHeadingBefore** | `2` | anything + heading comment |
| **spaceHeadingAfter** | `1` | heading comment + rule |
| **spaceRelatedAtRule** | `1` | rule or at-rule + related at-rule |
| **spaceUnrelatedAtRule** | `2` | rule or at-rule + unrelated at-rule |

### headingCommentIdentifiers

Type: `Array` of `string`s

Default: `[ '---', '===', '___', '+++', '***']`

A set of strings that, when found in a comment, mark that comment as a major section heading, which is then spaced accordingly. The spacing of all other comments will remain untouched. To never mark any comments as headings, pass an empty array literal — `[]` — or `null`.

### breakMultipleSelectors

Type: `boolean`

Default: `false`

Set to `true` in order to force the breaking of multiple selectors to new lines. This is the only time that Between will alter existing block formatting. Fills in a gap when used in conjunction with [perfectionist](https://www.npmjs.com/package/perfectionist).

In:

```css
a:hover, a:focus {}
```

Out:

```css
a:hover,
a:focus {}
```

## Examples

### Selector blocks

Spaces most selector blocks, but keeps related items together.

In:

```css
a {}
a:hover, a:focus {}
a[href^="/"] {}
.foo {}
.bar {}
.bar a {}
```

Out:

```css
a {}
a:hover, a:focus {}
a[href^="/"] {}

.foo {}

.bar {}
.bar a {}
```

This includes BEM blocks.

In:

```css
.block {}


.block__element {}
.block__element--modifier {}

.another-block {}

.no-js .another-block .foo {}
```

Out:

```css
.block {}
.block__element {}
.block__element--modifier {}

.another-block {}
.no-js .another-block .foo {}
```

### Comments

Only mess with comments if the comment is a major section heading. By default, a major section heading contains three or more of `-`, `_`, `=`, `+`, or `*` in a row. Override this in the options.

In:

```css
.foo {}
/* ---------- header ---------- */
.header {}
.header__logo {}
.header__cta {}
.nav {}
.nav__item {}
/* ---------- footer ---------- */
.footer__contact {}
.footer__social {}
```

Out:

```css
.foo {}


/* ---------- header ---------- */

.header {}
.header__logo {}
.header__cta {}

.nav {}
.nav__item {}


/* ---------- footer ---------- */

.footer__contact {}
.footer__social {}
```

### Media queries

Media queries are given ample spacing.

In:

```css
.foo {}
.bar {}
@media (min-width: 720px) {
  .baz {}
}
```

Out:

```css
.foo {}

.bar {}


@media (min-width: 720px) {
  .baz {}
}
```

Media query spacing tightens up in a BEM block.

In:

```css
.block {}
.block__element {}
@media (min-width: 720px) {
  .block__element--modifier {}
}
```

Out:

```css
.block {}
.block__element {}

@media (min-width: 720px) {
  .block__element--modifier {}
}
```

[PostCSS]: https://github.com/postcss/postcss
