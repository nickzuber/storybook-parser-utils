const acorn = require("acorn");
const jsx = require("acorn-jsx");
const lineColumn = require("line-column");

/**
 * Given a file as a string, find all instances of a story being added via storybook.
 *
 * @param {string} fileString The string of a file.
 * @return {Object.<kind: string, story: string, location: Location>}
 */
function getStories (fileString) {
  const tree = acorn.Parser.extend(jsx()).parse(fileString, {
    sourceType: 'module'
  });

  const allParsedStoryNodes = traverse(tree.body);
  const locations = lineColumn(fileString);

  return allParsedStoryNodes.reduce((collection, parsedStories) => {
    const kind = parsedStories.kind;
    const stories = parsedStories.stories.map(story => {
      const endLocations = locations.fromIndex(story.location.end);
      const line = endLocations.line;
      // Subtract 3 since we know the identifier is `add` which is 3 letters long.
      // This will point us to the start of the expression's column.
      const column = endLocations.col - 3;

      return {
        kind: kind.value,
        story: story.value,
        location: {
          line,
          column
        }
      }
    });
    return collection.concat(stories);
  }, []);
}

/**
 * Given a node within a "storybook" AST subtree, recursively build an object
 * that contains the names and locations of all the stories.
 *
 * @param {Object} node A node within an potential story subtree.
 * @param {Object.<stories: Array, kind: Object|null>} nodes Collection of story node data so far.
 * @return {Object.<stories: Array, kind: Object|null>}
 */
function parseStoryNodes (node, nodes = {stories: [], kind: null}) {
  if (typeof node !== 'object' || !node) {
    return nodes;
  }

  const callee = node.callee;

  switch (callee.type) {
    case 'MemberExpression':
      if (callee.object.type === 'CallExpression') {
        // @TODO This assumes the property is an `Identifier`
        if (callee.property.name === 'add') {
          // @TODO This assumes the argument is a sinlge `Literal`
          const name = node.arguments[0];
          nodes.stories.push({
            value: name.value || '[Unknown]',
            location: {start: callee.start, end: callee.end}
          });
        }
        return parseStoryNodes(callee.object, nodes);
      }
      break;
    case 'Identifier':
      if (callee.name === 'storiesOf') {
        // @TODO This assumes the argument is a sinlge `Literal`
        const name = node.arguments[0];
        nodes.kind = {
          value: name.value || '[Unknown]',
          location: {start: name.start, end: name.end}
        };
      } else {
        throw new TypeError('Root CallExpression was not `storiesOf`');
      }
      break;
  }

  return nodes;
}

/**
 * Given a file's AST, find and parse all nodes that are related to building stories.
 *
 * @param {Object} node A node within the file's AST.
 * @param {Array.<Object>} allParsedStoryNodes Collection of all the parsed story nodes so far.
 * @return {Array.<Object>}
 */
function traverse (node, allParsedStoryNodes = []) {
  // Leaf nodes.
  if (typeof node !== 'object' || !node) {
    return allParsedStoryNodes;
  }

  // Any instance of a `CallExpression` is a potential candidate for a story.
  if (node.type === 'CallExpression') {
    // Try to parse this expression for story data. We have control flows that will
    // error out if it turns out that this expression isn't a story.
    try {
      parsedStoryNodes = parseStoryNodes(node);
      allParsedStoryNodes.push(parsedStoryNodes);
    } catch (e) { /* noop */ }
  } else {
    // Parse all subtrees and search for stories. If any of those subtrees return
    // their own parsed node collection, we need to make sure to combine them
    // with any others we find.
    allParsedStoryNodes = Object.keys(node).reduce((collection, childKey) => {
      const localAllParsedStoryNodes = traverse(node[childKey]);
      return collection.concat(localAllParsedStoryNodes);
    }, []);
  }

  return allParsedStoryNodes;
}

module.exports.getStories = getStories;
