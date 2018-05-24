# PostCSS Between [![Build Status][ci-img]][ci]

[PostCSS] plugin that handles spacing between blocks for a more readable stylesheet.

Between will space your blocks in an opinionated manner:

- If you're using a BEM naming scheme, BEM blocks will be visually grouped by keeping their rules together. Adjacent BEM blocks will be separated by a blank line
- Two lines before a major section header comment and one line after
  - A major section header is any comment containing strings of repeated `-`, `_`, `=`, `+`, or `*`
- Two lines before and after a media query

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/tjgavlick/postcss-between.svg
[ci]:      https://travis-ci.org/tjgavlick/postcss-between

```css
.foo {
    /* Input example */
}
```

```css
.foo {
  /* Output example */
}
```

## Usage

```js
postcss([ require('postcss-between') ])
```

See [PostCSS] docs for examples for your environment.
