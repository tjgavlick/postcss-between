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

  // determines if selectors are related to the predicate
  function testRelated(predicates, selectors) {
    if (!predicates ||
        !selectors ||
        predicates.length === 0 ||
        selectors.length === 0) return false;

    for (let predicate of predicates) {
      for (let selector of selectors) {
        if (selector.indexOf(predicate) === 0) {
          return true;
        }
      }
    }
    return false;
  }

  // reduces selectors to a set of bem roots
  function generateRoots(selectors) {
    let roots = new Set();
    for (let selector of selectors) {
      for (let stem of selector.split(' ')) {
        // classes, trimming BEM blocks
        if (stem.charAt(0) === '.' || stem.charAt(0) === '#') {
          roots.add(stem.replace(/(__|\-\-).*$/g, ''));
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
          cachedBemRoots = generateRoots(rule.selectors);
          return;
        }

        // rule + rule
        if (rule.prev().type === 'rule') {
          // is this rule is in the same BEM block?
          if (testRelated(cachedBemRoots, rule.selectors)) {
            rule.raws.before = '\n';
          } else {
            rule.raws.before = '\n\n';
            cachedBemRoots = generateRoots(rule.selectors);
          }

        // comment + rule
        } else if (rule.prev().type === 'comment' && testHeading(rule.prev().text)) {
          rule.raws.before = '\n\n';
          cachedBemRoots = generateRoots(rule.selectors);

        // @rule + rule
        } else if (rule.prev().type === 'atrule') {
          // if we're still in a BEM block, space conservatively
          if (testRelated(cachedBemRoots, rule.selectors)) {
            rule.raws.before = '\n\n';
          // otherwise, isolate the block
          } else {
            rule.raws.before = '\n\n\n';
            cachedBemRoots = generateRoots(rule.selectors);
          }

        // anything else + rule
        } else {
          cachedBemRoots = generateRoots(rule.selectors);
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

        if (rule.nodes.length > 0) {
          // is this a part of a continuing BEM block?
          let innerRules = rule.nodes.filter(node => node.type === 'rule');
          let innerSelectors = Array.from(innerRules.reduce((acc, cur) => {
            for (let selector of cur.selectors) {
              acc.add(selector);
            }
            return acc;
          }, new Set()));
          if (testRelated(cachedBemRoots, innerSelectors)) {
            rule.raws.before = '\n\n';
          } else {
            rule.raws.before = '\n\n\n';
          }

        // if no children, isolate the @rule
        } else {
          rule.raws.before = '\n\n\n';
        }
      }
    });
  };
});
