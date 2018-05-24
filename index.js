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

  return function (root) {
    var cachedBemRoots = [];
    root.walk(rule => {
      if (rule.type === 'rule') {
        // rule + rule
        if (rule.prev() && rule.prev().type === 'rule') {
          // is this rule is in the same BEM block?
          if (testBem(cachedBemRoots, rule.selectors)) {
            rule.raws.before = '\n';
          } else {
            rule.raws.before = '\n\n';
            cachedBemRoots = generateBemRoots(rule.selectors);
          }
        // comment + rule
        } else if (rule.prev() &&
          rule.prev().type === 'comment' &&
          testHeading(rule.prev().text)) {
          rule.raws.before = '\n\n';
          cachedBemRoots = generateBemRoots(rule.selectors);
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
        if (rule.prev()) {
          rule.raws.before = '\n\n\n';
        }
      }
    });
  };
});
