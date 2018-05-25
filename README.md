# Between [![Build Status](https://travis-ci.org/tjgavlick/postcss-between.svg?branch=master)](https://travis-ci.org/tjgavlick/postcss-between)

(Upcoming) [PostCSS] plugin that handles spacing between blocks for a more readable stylesheet.

## Usage

```js
postcss([ require('postcss-between') ])
```

Use with Node 6 or greater.

See [PostCSS] docs for examples for your environment.

## Examples

Between will not apply any formatting to the declarations inside your CSS rules; it will only affect the spaces between blocks. Use it as the mastering to Prettier's mixing, for example.

Spacing will be handled based on some *opinions*:

### Selector blocks

Spaces most selector blocks, but keeps related items together.

In:

```css
.foo {}
.bar {}
.bar a {}
```

Out:

```css
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

.another-block .foo {}
```

Out:

```css
.block {}
.block__element {}
.block__element--modifier {}

.another-block {}
.another-block .foo {}
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

## TODO

- Group additional related selectors:
  - `h1` with `h2`, etc?
- Add aspects to options
