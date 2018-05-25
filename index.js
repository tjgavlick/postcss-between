const postcss = require('postcss');

module.exports = postcss.plugin('postcss-between', (opts = {}) => {
  opts = Object.assign({
    breakMultipleSelectors: false,
    headingCommentIdentifiers: [ '---', '===', '___', '+++', '***']
  }, opts);

  // escape a string for safe insertion into a RegExp
  function escapeRegExp(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  // removes combinators from a selector
  function removeCombinators(selector) {
    // replace combinators with a space in case author has spaced selector tightly
    // e.g. li+li
    return selector.replace(/\+|~(?!=)|>/g, ' ').replace(/\s+/, ' ');
  }

  // determines if test selectors are related to predicate selectors
  function testRelated(predicates, selectors) {
    if (!predicates ||
        !selectors ||
        predicates.length === 0 ||
        selectors.length === 0) return false;

    // group predicates by named (classes, ids) and other
    let namedPredicates = [];
    let otherPredicates = [];
    for (let predicate of predicates) {
      if (predicate.charAt(0) === '.' || predicate.charAt(0) === '#') {
        namedPredicates.push(predicate);
      } else {
        otherPredicates.push(predicate);
      }
    }

    for (let selector of selectors) {
      selector = removeCombinators(selector);
      // class/id blocks
      for (let predicate of namedPredicates) {
        if (selector.indexOf(predicate) >= 0) {
          return true;
        }
      }
      // other elements
      for (let predicate of otherPredicates) {
        let elements = selector.match(/^[a-zA-Z ]+/);
        if (elements) {
          for (let element of elements[0].split(' ')) {
            if (element.indexOf(predicate) === 0) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  // reduces selectors to a set of bem roots
  function generateRoots(selectors) {
    let roots = new Set();
    for (let selector of selectors) {
      selector = removeCombinators(selector);
      // class/id/BEM roots
      for (let stem of selector.split(' ')) {
        if (stem.charAt(0) === '.' || stem.charAt(0) === '#') {
          roots.add(stem.replace(/(__|\-\-|:|\[).*$/, ''));
        }
      }
      // plain elements, if not already handled by a class/id block
      let elements = selector.match(/^[a-zA-Z ]+/);
      if (elements) {
        for (let element of elements[0].split(' ')) {
          roots.add(element);
        }
      }
    }
    return Array.from(roots);
  }

  // determines if a given comment is a 'heading' comment
  function testHeading(text) {
    return new RegExp(
      opts.headingCommentIdentifiers
        .map(str => escapeRegExp(str))
        .join('|')
    ).test(text);
  }

  // adds newlines to raws.before, respecting initial selector indentation
  function addSpaceBefore(before, count) {
    return '\n'.repeat(count) + before.replace(/\n/g, '');
  }


  return root => {
    var cachedRoots = [];
    root.walk(rule => {
      if (rule.type === 'rule') {
        // break multiple selectors to new lines
        if (opts.breakMultipleSelectors) {
          let indentation = rule.raws.before.replace(/^[\s\n]*\n/, '');
          rule.selector = rule.selector.replace(/\s*,\s*/g, ',\n' + indentation);
        }

        // no need to space above if it's the first rule
        if (rule.prev() === undefined) {
          cachedRoots = generateRoots(rule.selectors);
          return;
        }

        // rule + rule
        if (rule.prev().type === 'rule') {
          // is this rule is in the same BEM block?
          if (testRelated(cachedRoots, rule.selectors)) {
            rule.raws.before = addSpaceBefore(rule.raws.before, 1);
          } else {
            rule.raws.before = addSpaceBefore(rule.raws.before, 2);
            cachedRoots = generateRoots(rule.selectors);
          }

        // comment + rule
        } else if (rule.prev().type === 'comment' && testHeading(rule.prev().text)) {
          rule.raws.before = addSpaceBefore(rule.raws.before, 2);
          cachedRoots = generateRoots(rule.selectors);

        // @rule + rule
        } else if (rule.prev().type === 'atrule') {
          // if we're still in a BEM block, space conservatively
          if (testRelated(cachedRoots, rule.selectors)) {
            rule.raws.before = addSpaceBefore(rule.raws.before, 2);
          // otherwise, isolate the block
          } else {
            rule.raws.before = addSpaceBefore(rule.raws.before, 3);
            cachedRoots = generateRoots(rule.selectors);
          }

        // anything else + rule
        } else {
          cachedRoots = generateRoots(rule.selectors);
        }
      }

      if (rule.type === 'comment') {
        // space major section headings
        if (rule.prev() !== undefined && testHeading(rule.text)) {
          rule.raws.before = addSpaceBefore(rule.raws.before, 3);
          rule.after = addSpaceBefore(rule.raws.before, 2);
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
          if (testRelated(cachedRoots, innerSelectors)) {
            rule.raws.before = addSpaceBefore(rule.raws.before, 2);
          } else {
            rule.raws.before = addSpaceBefore(rule.raws.before, 3);
          }

        // if no children, isolate the @rule
        } else {
          rule.raws.before = addSpaceBefore(rule.raws.before, 3);
        }
      }
    });
  };
});
