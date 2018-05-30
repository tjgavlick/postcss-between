const postcss = require('postcss');


/**
 * Escapes a string for insertion into a RegExp
 * @param {string} str
 */
function escapeRegExp(str) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Removes combinators from a selector string
 * @param {string} selector
 */
function removeCombinators(selector) {
  // replace combinators with a space in case author has spaced selector tightly
  // e.g. li+li
  return selector.replace(/\+|~(?!=)|>/g, ' ').replace(/\s+/, ' ');
}

/**
 * Tests whether a particular identifier exists within a given CSS selector
 * @param {string} selector - a CSS selector string
 * @param {string} part - the identifier we're searching for
 * @return {boolean} whether the part was found in the selector
 */
function testSelectorPart(selector, part) {
  let searchIndex = selector.indexOf(part);
  let nextChar = selector.charAt(searchIndex + part.length);
  return searchIndex >= 0 && !/[a-zA-Z]/.test(nextChar);
}

/**
 * Determines if a set of selectors is related to a predicate set
 * @param {Array<string>} predicates - a set of predicate selector stems to test
 *     against. A selector stem is a selector component without psuedoclasses,
 *     attribute selectors, BEM extensions, and so on
 * @param {Array<string>} selectors - an array of CSS selector strings
 * @return {boolean} whether the selectors are related to the predicates
 */
function testRelatedSelectors(predicates, selectors) {
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
      if (testSelectorPart(selector, predicate)) {
        return true;
      }
    }
    // other elements
    for (let predicate of otherPredicates) {
      let elements = selector.match(/^[a-zA-Z ]+/);
      if (elements && testSelectorPart(elements[0], predicate)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Reduces selectors to a set of selector stems
 * @param {Array<string>} selectors - an array of CSS selector strings
 * @return {Array<string>} an array of selector stems
 */
function generateSelectorStems(selectors) {
  let stems = new Set();
  for (let selector of selectors) {
    selector = removeCombinators(selector);
    // class/id/BEM stems
    for (let stem of selector.split(' ')) {
      if (stem.charAt(0) === '.' || stem.charAt(0) === '#') {
        stems.add(stem.replace(/(__|\-\-|:|\[).*$/, ''));
      }
    }
    // plain elements, if not already scoped to a class/id block
    let elements = selector.match(/^[a-zA-Z ]+/);
    if (elements) {
      for (let element of elements[0].split(' ')) {
        stems.add(element);
      }
    }
  }
  return Array.from(stems);
}

/**
 * Adds newlines to postcss raws.before, respecting selector indentation
 * @param {string} before - postcss raws.before value for a block
 * @param {int} count - the number of blank lines to add
 * @return {string} amended postcss raws.before value
 */
function addNewlinesBefore(before, count) {
  return '\n'.repeat(count + 1) + before.replace(/\n/g, '');
}


module.exports = postcss.plugin('postcss-between', (opts = {}) => {
  opts = Object.assign({
    spaceRelatedRule: 0,
    spaceUnrelatedRule: 1,
    spaceHeadingBefore: 2,
    spaceHeadingAfter: 1,
    spaceRelatedAtRule: 1,
    spaceUnrelatedAtRule: 2,
    breakMultipleSelectors: false,
    headingCommentIdentifiers: [ '---', '===', '___', '+++', '***']
  }, opts);

  // Determines whether comment text matches one or more heading comment
  // identifiers, as set in the plugin options
  const testHeadingComment = (() => {
    // if no identifiers are set, every call should return false
    if (!opts.headingCommentIdentifiers ||
        opts.headingCommentIdentifiers.length === 0) {
      return () => false;
    }
    const headingRegExp = new RegExp(
      opts.headingCommentIdentifiers
        .map(str => escapeRegExp(str))
        .join('|')
    );
    return text => headingRegExp.test(text);
  })();

  return root => {
    var cachedRoots = [];
    root.walk(rule => {
      if (rule.type === 'rule') {
        // break multiple selectors to new lines if requested
        if (opts.breakMultipleSelectors) {
          let indentation = rule.raws.before.replace(/^[\s\n]*\n/, '');
          rule.selector = rule.selector.replace(/\s*,\s*/g, ',\n' + indentation);
        }

        // no need to space above if it's the first rule
        if (rule.prev() === undefined) {
          cachedRoots = generateSelectorStems(rule.selectors);
          return;
        }

        // rule + rule
        if (rule.prev().type === 'rule') {
          // is this rule in the same BEM block?
          if (testRelatedSelectors(cachedRoots, rule.selectors)) {
            rule.raws.before = addNewlinesBefore(rule.raws.before, opts.spaceRelatedRule);
          } else {
            rule.raws.before = addNewlinesBefore(rule.raws.before, opts.spaceUnrelatedRule);
            cachedRoots = generateSelectorStems(rule.selectors);
          }

        // heading comment + rule
        } else if (rule.prev().type === 'comment' && testHeadingComment(rule.prev().text)) {
          rule.raws.before = addNewlinesBefore(rule.raws.before, opts.spaceHeadingAfter);
          cachedRoots = generateSelectorStems(rule.selectors);

        // atrule + rule
        } else if (rule.prev().type === 'atrule') {
          // if we're still in a related block, space conservatively
          if (testRelatedSelectors(cachedRoots, rule.selectors)) {
            rule.raws.before = addNewlinesBefore(rule.raws.before, opts.spaceRelatedAtRule);
          // otherwise, isolate the block
          } else {
            rule.raws.before = addNewlinesBefore(rule.raws.before, opts.spaceUnrelatedAtRule);
            cachedRoots = generateSelectorStems(rule.selectors);
          }

        // anything else + rule
        } else {
          cachedRoots = generateSelectorStems(rule.selectors);
        }
      }

      if (rule.type === 'comment') {
        // space major section headings
        if (rule.prev() !== undefined && testHeadingComment(rule.text)) {
          rule.raws.before = addNewlinesBefore(rule.raws.before, opts.spaceHeadingBefore);
        }
      }

      if (rule.type === 'atrule') {
        if (rule.prev() === undefined) return;

        if (rule.nodes.length > 0) {
          // is this a part of a block of related selectors?
          let innerRules = rule.nodes.filter(node => node.type === 'rule');
          let innerSelectors = Array.from(innerRules.reduce((acc, cur) => {
            for (let selector of cur.selectors) {
              acc.add(selector);
            }
            return acc;
          }, new Set()));
          if (testRelatedSelectors(cachedRoots, innerSelectors)) {
            rule.raws.before = addNewlinesBefore(rule.raws.before, opts.spaceRelatedAtRule);
          } else {
            rule.raws.before = addNewlinesBefore(rule.raws.before, opts.spaceUnrelatedAtRule);
          }

        // if no children, isolate this block
        } else {
          rule.raws.before = addNewlinesBefore(rule.raws.before, opts.spaceUnrelatedAtRule);
        }
      }
    });
  };
});
