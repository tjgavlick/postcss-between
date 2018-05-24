const postcss = require('postcss');
const plugin = require('./');

function run(input, output, opts) {
  return postcss([ plugin(opts) ]).process(input)
    .then(result => {
      expect(result.css).toEqual(output);
      expect(result.warnings().length).toBe(0);
    });
}

it('runs', () => {
  return run('a { }', 'a { }', {});
});

it('doesn\'t meddle with inner formatting', () => {
  return run(
    'a { font-weight:700;text-decoration:none }',
    'a { font-weight:700;text-decoration:none }'
  );
});

it('correctly spaces general rules', () => {
  return run(`
a { color: #0f0; }
strong { color: #f00; }
em { font-weight: 400; }
`, `
a { color: #0f0; }

strong { color: #f00; }

em { font-weight: 400; }
`);
});

it('avoids spacing related selectors', () => {
  return run(`
.foo { padding: 1rem; }
.foo li { margin: 0; }
`, `
.foo { padding: 1rem; }
.foo li { margin: 0; }
`);
});

it('avoids spacing a BEM element', () => {
  return run(`
.block { padding: 1rem; background: #ccc; }
.block__element { display: block; }
`, `
.block { padding: 1rem; background: #ccc; }
.block__element { display: block; }
`);
});

it('collapses spacing on a BEM element', () => {
  return run(`
.block { padding: 1rem; background: #ccc; }

.block__element { display: block; }
`, `
.block { padding: 1rem; background: #ccc; }
.block__element { display: block; }
`);
});

it('finds non-explicit BEM blocks', () => {
  return run(`
div .block__foo { display: block; }

.block__bar--baz strong { color: #f00; }
`, `
div .block__foo { display: block; }
.block__bar--baz strong { color: #f00; }
`);
});

it('handles conglomerate BEM blocks', () => {
  return run(`
.block,
.another-block { display: block; }

.block__foo { color: #f00; }

.another-block__bar { padding: 1rem; }
`, `
.block,
.another-block { display: block; }
.block__foo { color: #f00; }
.another-block__bar { padding: 1rem; }
`);
});

it('doesn\'t mess with standard comments', () => {
  return run(`
.foo {
  /* comment */
  display: block;
}

/* another comment */
.bar {
  display: block;  /* yet another comment */
}
`, `
.foo {
  /* comment */
  display: block;
}

/* another comment */
.bar {
  display: block;  /* yet another comment */
}
`);
});

it('spaces section comments', () => {
  return run(`
.foo { display: block; }
/* ---------- major section ---------- */
.bar { display: block; }
`, `
.foo { display: block; }


/* ---------- major section ---------- */

.bar { display: block; }
`);
});

it('spaces unrelated media queries before', () => {
  return run(`
.foo { display: block; }
@media print {
  .bar { display: none; }
}
`, `
.foo { display: block; }


@media print {
  .bar { display: none; }
}
`);
});

it('spaces BEM block media queries before', () => {
  return run(`
.foo { display: block; }
@media print {
  .foo__element { display: none; }
}
`, `
.foo { display: block; }

@media print {
  .foo__element { display: none; }
}
`);
});

it('spaces multiple BEM block media queries before', () => {
  return run(`
.foo { display: block; }
@media print {
  .foo__element { display: none; }
}
@media (min-width: 720px) {
  .foo { background: #f00 }
}
`, `
.foo { display: block; }

@media print {
  .foo__element { display: none; }
}

@media (min-width: 720px) {
  .foo { background: #f00 }
}
`);
});
