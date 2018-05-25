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

it('avoids spacing related selectors', () => {
  return run(`
.foo { }
.foo li { }
`, `
.foo { }
.foo li { }
`);
});

it('avoids spacing a BEM element', () => {
  return run(`
.block { }
.block__element { }
`, `
.block { }
.block__element { }
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

it('finds non-explicit BEM blocks', () => {
  return run(`
div .block__foo { }

.block__bar--baz strong { }
`, `
div .block__foo { }
.block__bar--baz strong { }
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
