const postcss = require('postcss');
const plugin = require('./');

function run(input, output, opts) {
  return postcss([ plugin(opts) ]).process(input)
    .then(result => {
      expect(result.css).toEqual(output);
      expect(result.warnings().length).toBe(0);
    });
}


/*
 * barebones functionality
 * -----------------------
 */

it('runs', () => {
  return run('a { }', 'a { }', {});
});

it('doesn\'t meddle with inner formatting', () => {
  return run(`
.foo { font-weight:700;text-decoration:none }

.bar {
    font-weight:700;
  text-decoration:none;
}
`, `
.foo { font-weight:700;text-decoration:none }

.bar {
    font-weight:700;
  text-decoration:none;
}
`
  );
});

it('doesn\'t meddle with selector indentation', () => {
  return run(`
.grid {}
@media (min-width: 720px) {
  .grid {}
  .grid__unit {}
}
`, `
.grid {}

@media (min-width: 720px) {
  .grid {}
  .grid__unit {}
}
`
  );
});


/*
 * selector rule spacing
 * ---------------------
 */

it('correctly spaces general rules', () => {
  return run(`
a { }
strong { }
em { }
`, `
a { }

strong { }

em { }
`);
});

it('groups related selectors by element', () => {
  return run(`
div { }
div p { }
a { }
strong a { }
p { }
p.foo { }
`, `
div { }
div p { }

a { }
strong a { }

p { }
p.foo { }
`);
});

it('groups related selectors by class', () => {
  return run(`
.foo { }
.foo li { }
.bar { }
`, `
.foo { }
.foo li { }

.bar { }
`);
});

it('groups similar selectors regardless of pseudoclass', () => {
  return run(`
a { }
a:hover,
a:focus { }
input { }
input:disabled { }
.foo { }
.foo:hover { }
.bar:hover { }
.bar { }
`, `
a { }
a:hover,
a:focus { }

input { }
input:disabled { }

.foo { }
.foo:hover { }

.bar:hover { }
.bar { }
`);
});

it('groups similar selectors regardless of pseudoelement', () => {
  return run(`
div { }
div::before { }
.foo { }
.foo::after { }
input::-webkit-input-placeholder { }
input::-moz-placeholder { }
`, `
div { }
div::before { }

.foo { }
.foo::after { }

input::-webkit-input-placeholder { }
input::-moz-placeholder { }
`);
});

it('groups similar selectors regardless of attribute selector', () => {
  return run(`
input { }
input[type="search"] { }
input[type="text"]:focus { }
a { }
a[href^="/"] { }
.input[type="search"] { }
.input { }
`, `
input { }
input[type="search"] { }
input[type="text"]:focus { }

a { }
a[href^="/"] { }

.input[type="search"] { }
.input { }
`);
});

it('is not greedy', () => {
  return run(`
.foo { }
.foobar { }
a { }
abbr { }
.foobar { }
.foo { }
`, `
.foo { }

.foobar { }

a { }

abbr { }

.foobar { }

.foo { }
`);
});

it('doesn\'t choke on element combinators', () => {
  return run(`
.foo { }
.foo ~ li { }
nav:hover > .foo { }
.bar + .bar { }
.bar { }
a { }
strong + a { }
`, `
.foo { }
.foo ~ li { }
nav:hover > .foo { }

.bar + .bar { }
.bar { }

a { }
strong + a { }
`);
});

it('avoids spacing a BEM element', () => {
  return run(`
.block { }
.block--modifier { }
.block__element { }
.block__element--modifier { }
`, `
.block { }
.block--modifier { }
.block__element { }
.block__element--modifier { }
`);
});

it('collapses spacing on a BEM element', () => {
  return run(`
.block { }

.block__element { }
`, `
.block { }
.block__element { }
`);
});

it('finds non-explicit or nested BEM blocks', () => {
  return run(`
.no-js .block__foo { }

.block__bar--baz strong { }
.js .block { }
`, `
.no-js .block__foo { }
.block__bar--baz strong { }
.js .block { }
`);
});

it('handles conglomerate BEM blocks', () => {
  return run(`
.block,
.another-block { }

.block__foo { }

.another-block__bar { }
`, `
.block,
.another-block { }
.block__foo { }
.another-block__bar { }
`);
});

it('doesn\'t mistakenly identify word delimiters as BEM', () => {
  return run(`
.foo-bar { }
.foo-baz { }
.foo-baz__element { }
`, `
.foo-bar { }

.foo-baz { }
.foo-baz__element { }
`);
});


/*
 * comments
 * --------
 */

it('doesn\'t mess with standard comments', () => {
  return run(`
.foo {
  /* comment */
  display: block;
}

/* another comment */
.bar {
  color: #f00;  /* yet another comment */
}
`, `
.foo {
  /* comment */
  display: block;
}

/* another comment */
.bar {
  color: #f00;  /* yet another comment */
}
`);
});

it('spaces section comments', () => {
  return run(`
.foo { }
/* ---------- major section ---------- */
.bar { }
`, `
.foo { }


/* ---------- major section ---------- */

.bar { }
`);
});

it('correctly handles multiline comments', () => {
  return run(`
/*
 * thing
 */
.foo { }
/*
 * ---------- major thing ----------
 */
.bar { }
`, `
/*
 * thing
 */
.foo { }


/*
 * ---------- major thing ----------
 */

.bar { }
`);
});


/*
 * @rules
 * ------
 */

it('spaces unrelated media queries before', () => {
  return run(`
.foo { }
@media print {
  .bar { }
}
`, `
.foo { }


@media print {
  .bar { }
}
`);
});

it('spaces BEM block media queries before', () => {
  return run(`
.foo { }
@media print {
  .foo__element { }
}
`, `
.foo { }

@media print {
  .foo__element { }
}
`);
});

it('spaces multiple BEM block media queries before', () => {
  return run(`
.foo { }
@media print {
  .foo__element { }
}
@media (min-width: 720px) {
  .foo { }
}
`, `
.foo { }

@media print {
  .foo__element { }
}

@media (min-width: 720px) {
  .foo { }
}
`);
});

it('spaces unrelated media queries after', () => {
  return run(`
@media print {
  .foo { }
}
.bar { }
`, `
@media print {
  .foo { }
}


.bar { }
`);
});

it('spaces related media queries after', () => {
  return run(`
.block {}
.block__element {}
@media print {
  .block__element {}
}
.block {}
.block__element {}
`, `
.block {}
.block__element {}

@media print {
  .block__element {}
}

.block {}
.block__element {}
`);
});

it('isolates empty @rules', () => {
  return run(`
.foo {}
@media print { }
.bar {}
`, `
.foo {}


@media print { }


.bar {}
`);
});


/*
 * heading comment identifiers option
 * ----------------------------------
 */

it('respects the heading comment identifiers option', () => {
  return run(`
.foo {}
/* ---------- not a heading ---------- */
.bar {}
`, `
.foo {}
/* ---------- not a heading ---------- */
.bar {}
`, { headingCommentIdentifiers: ['==='] });
});

it('allows the user to mark no comments as major headings with an empty array', () => {
  return run(`
.foo {}
/* ---------- not a heading ---------- */
.bar {}
/* not a heading */
.baz {}
/* */
.foobar {}
`, `
.foo {}
/* ---------- not a heading ---------- */
.bar {}
/* not a heading */
.baz {}
/* */
.foobar {}
`, { headingCommentIdentifiers: [] });
});

it('allows the user to mark no comments as major headings with a falsy value', () => {
  return run(`
.foo {}
/* ---------- not a heading ---------- */
.bar {}
/* not a heading */
.baz {}
/* */
.foobar {}
`, `
.foo {}
/* ---------- not a heading ---------- */
.bar {}
/* not a heading */
.baz {}
/* */
.foobar {}
`, { headingCommentIdentifiers: null });
});


/*
 * selector newline option
 * -----------------------
 */

it('retains existing selectors by default', () => {
  return run(`
a:hover, a:focus {}
button:hover,
button:focus {}
input[type="submit"]:hover,

input[type="submit"]:focus {}
`, `
a:hover, a:focus {}

button:hover,
button:focus {}

input[type="submit"]:hover,

input[type="submit"]:focus {}
`);
});

it('breaks multiple selectors to new lines when requested', () => {
  return run(`
a:hover, a:focus {}
button:hover,
button:focus {}
input[type="submit"]:hover,

input[type="submit"]:focus {}
`, `
a:hover,
a:focus {}

button:hover,
button:focus {}

input[type="submit"]:hover,
input[type="submit"]:focus {}
`, { breakMultipleSelectors: true });
});

it('preserves initial selector indentation when breaking', () => {
  return run(`
@media all {
  a:hover, a:focus {}
  button:hover, button:focus {}
}
`, `
@media all {
  a:hover,
  a:focus {}

  button:hover,
  button:focus {}
}
`, { breakMultipleSelectors: true });
});


/*
 * rule spacing options
 * --------------------
 */

it('respects rule spacing options', () => {
  return run(`
.foo {}
.foo a {}
.bar {}
`, `
.foo {}


.foo a {}



.bar {}
`, { spaceRelatedRule: 2, spaceUnrelatedRule: 3 });
});

it('respects heading spacing options', () => {
  return run(`
.foo {}
/* ---------- heading comment ---------- */
.bar {}
`, `
.foo {}
/* ---------- heading comment ---------- */


.bar {}
`, { spaceHeadingBefore: 0, spaceHeadingAfter: 2 });
});

it('respects at-rule spacing options', () => {
  return run(`
.foo {}
@media (min-width: 720px) {
  .foo {}
}
.foo {}
@media (min-width: 720px) {
  .bar {}
}
.baz {}
`, `
.foo {}
@media (min-width: 720px) {
  .foo {}
}
.foo {}



@media (min-width: 720px) {
  .bar {}
}



.baz {}
`, { spaceRelatedAtRule: 0, spaceUnrelatedAtRule: 3 });
});
