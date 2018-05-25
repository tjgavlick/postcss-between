const postcss = require('postcss');

const defaults = {
  headingCommentIdentifiers: [
    '---',
    '===',
    '___',
    '+++',
    '***'
  ]
};

module.exports = postcss.plugin('postcss-between', function (options) {
  options = Object.assign(defaults, options || {});

  // utility to escape a string for safe insertion into a RegExp
  function escapeRegExp(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  // determines if selectors belong to the same BEM block as the predicate
  function testBem(predicates, selectors) {
    if (!predicates ||
        !selectors ||
        predicates.length === 0 ||
        selectors.length === 0) return false;

    for (let predicate of predicates) {
      for (let selector of selectors) {
        if (selector.indexOf(predicate) >= 0) {
          return true;
        }
      }
    }
    return false;
  }

  // reduces selectors to a set of bem roots
  function generateBemRoots(selectors) {
    let roots = new Set();
    for (let selector of selectors) {
      for (let stem of selector.split(' ')) {
        if (stem.charAt(0) === '.' || stem.charAt(0) === '#') {
          roots.add(stem.replace(/__.*$/, ''));
        }
      }
    }
    return Array.from(roots);
  }

  // determines if a given comment is a 'heading' comment
  function testHeading(text) {
    return new RegExp(
      options.headingCommentIdentifiers
        .map(str => escapeRegExp(str))
        .join('|')
    ).test(text);
  }

  // main loop
  return function (root) {
    var cachedBemRoots = [];
    root.walk(rule => {
      if (rule.type === 'rule') {
        // no need to space above if it's the first rule
        if (rule.prev() === undefined) {
          cachedBemRoots = generateBemRoots(rule.selectors);
          return;
        }

        // rule + rule
        if (rule.prev().type === 'rule') {
          // is this rule is in the same BEM block?
          if (testBem(cachedBemRoots, rule.selectors)) {
            rule.raws.before = '\n';
          } else {
            rule.raws.before = '\n\n';
            cachedBemRoots = generateBemRoots(rule.selectors);
          }

        // comment + rule
        } else if (rule.prev().type === 'comment' && testHeading(rule.prev().text)) {
          rule.raws.before = '\n\n';
          cachedBemRoots = generateBemRoots(rule.selectors);

        // @rule + rule
        } else if (rule.prev().type === 'atrule') {
          // if we're still in a BEM block, space conservatively
          if (testBem(cachedBemRoots, rule.selectors)) {
            rule.raws.before = '\n\n';
          // otherwise, isolate the block
          } else {
            rule.raws.before = '\n\n\n';
            cachedBemRoots = generateBemRoots(rule.selectors);
          }

        // anything else + rule
        } else {
          cachedBemRoots = generateBemRoots(rule.selectors);
        }
      }

      if (rule.type === 'comment') {
        // space major section headings
        if (testHeading(rule.text)) {
          rule.raws.before = '\n\n\n';
          rule.after = '\n\n';
        }
      }

      if (rule.type === 'atrule') {
        if (rule.prev() === undefined) return;

        // is this a part of a continuing BEM block?
        if (rule.nodes.length > 0) {
          let innerRules = rule.nodes.filter(node => node.type === 'rule');
          let innerSelectors = Array.from(innerRules.reduce((acc, cur) => {
            for (let selector of cur.selectors) {
              acc.add(selector);
            }
            return acc;
          }, new Set()));
          if (testBem(cachedBemRoots, innerSelectors)) {
            rule.raws.before = '\n\n';
          } else {
            rule.raws.before = '\n\n\n';
          }
        } else {
          rule.raws.before = '\n\n\n';
        }
      }
    });
  };
});
