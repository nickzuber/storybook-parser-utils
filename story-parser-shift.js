const {printAsError} = require('./utils');
const {parseModuleWithLocation} = require('shift-parser');

/**
 * Given a file as a string, find all instances of a story being added via storybook.
 *
 * @param {string} fileString The string of a file.
 * @return {Object.<kind: string, story: string, location: Location>}
 */
function getStories (fileString) {
  const {tree, locations: locationWeakMap} = parseModuleWithLocation(fileString);
  const allParsedStoryNodes = traverse(tree.items, locationWeakMap);
  return allParsedStoryNodes.reduce((collection, parsedStories) => {
    const kind = parsedStories.kind;
    const stories = parsedStories.stories.map(story => ({
      kind: kind.value,
      story: story.value,
      location: story.location
    }));
    return collection.concat(stories);
  }, []);
}

/**
 * Given a node within a "storybook" AST subtree, recursively build an object
 * that contains the names and locations of all the stories.
 *
 * @param {Object} node A node within an potential story subtree.
 * @param {WeakMap} locationWeakMap A mapping from node reference to location.
 * @param {Object.<stories: Array, kind: Object|null>} nodes Collection of story node data so far.
 * @return {Object.<stories: Array, kind: Object|null>}
 */
function parseStoryNodes (node, locationWeakMap, nodes = {stories: [], kind: null}) {
  if (typeof node !== 'object' || !node) {
    return nodes;
  }

  switch (node.callee.type) {
    case 'StaticMemberExpression':
      if (node.callee.object.type === 'CallExpression') {
        // @TODO This assumes the argument is a single `LiteralStringExpression`
        // (e.g. `.add('string')`
        if (node.callee.property === 'add') {
          nodes.stories.push({
            value: node.arguments[0].value || '[Unknown]',
            location: locationWeakMap.get(node.callee)
          });
        }
        return parseStoryNodes(node.callee.object, locationWeakMap, nodes);
      }
      break;
    case 'IdentifierExpression':
      if (node.callee.name === 'storiesOf') {
        nodes.kind = {
          value: node.arguments[0].value || '[Unknown]',
          location: locationWeakMap.get(node.callee)
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
 * @param {WeakMap} locationWeakMap A mapping from node reference to location.
 * @param {Array.<Object>} allParsedStoryNodes Collection of all the parsed story nodes so far.
 * @return {Array.<Object>}
 */
function traverse (node, locationWeakMap, allParsedStoryNodes = []) {
  // Leaf nodes.
  if (typeof node !== 'object' || !node) {
    return allParsedStoryNodes;
  }

  // Any instance of a `CallExpression` is a potential candidate for a story.
  if (node.type === 'CallExpression') {
    // Try to parse this expression for story data. We have control flows that will
    // error out if it turns out that this expression isn't a story.
    try {
      parsedStoryNodes = parseStoryNodes(node, locationWeakMap);
      allParsedStoryNodes.push(parsedStoryNodes);
    } catch (e) { /* noop */ }
  } else {
    // Parse all subtrees and search for stories. If any of those subtrees return
    // their own parsed node collection, we need to make sure to combine them
    // with any others we find.
    allParsedStoryNodes = Object.keys(node).reduce((collection, childKey) => {
      const localAllParsedStoryNodes = traverse(node[childKey], locationWeakMap);
      return collection.concat(localAllParsedStoryNodes);
    }, []);
  }

  return allParsedStoryNodes;
}

const input = `
import React from 'react'
import {storiesOf} from '@storybook/react'

const IGNORE = () => {}
function IGNORE2 () {}

storiesOf('asd').add(foo)

const _ = storiesOf('My Stories')
  .add('Foo', () => {
    // stuff
  })
  .add('Bar', () => {
    // stuff
  })

storiesOf('More Stories')
  .add('Thing', fn)
  .addDecorator()
  .add('Baz',
  () => {

  })
  .add(
    'Buz',
     () => {})

notStories('Not a Story').add('Thank u', fn).subtract('next',
 () => {

 })
`

const input2 = `import React, {Component} from 'react';
import {storiesOf} from '@storybook/react';
import {action} from '@storybook/addon-actions';
import Card, {CategoryIcon} from 'components/Card';
import Icon from 'components/Icon';
import ErrorMessage from 'components/ErrorMessage';

storiesOf('Card', module)
  .addDecorator(storyFn => <div style={{width: 269}}>{storyFn()}</div>)
  .add('Basic', () => (
    <Card style={{height: 186}}>
      <Card.Title>Basic Card</Card.Title>
    </Card>
  ));
storiesOf('Card/Atoms', module)
  .addDecorator(storyFn => <div style={{width: 269}}>{storyFn()}</div>)
  .add('Base', () => (
    <Card style={{height: 186}} onDismiss />
  ))
  .add('Dismissable', () => (
    <CardSimulation />
  ))
  .add('Nested', () => (
    <Card type={Card.Type.Nested} style={{height: 186}} />
  ))
  .add('Action Bar', () => (
    <Card.Controls>
      <Card.Button>
        Button 1
      </Card.Button>
      <Card.Button>
        Button 2
      </Card.Button>
    </Card.Controls>
  ))
  .add('Card Row', () => (
    <div>
      <Card.Row icon={<Icon.Clock size="12" />}>
        {'Tue, Aug 2 at 10:30am -> 12:00pm'}
      </Card.Row>
      <Card.Row icon={<Icon.Location size="12" />}>
        Greenwich, Floor 2, Building A
      </Card.Row>
      <Card.Row icon={<Icon.Organizer size="12" />}>
        Ryan Coughlin
      </Card.Row>
    </div>
  ))
  .add('Card Category Icon', () => (
    <React.Fragment>
      <CategoryIcon.Assistant />
      <CategoryIcon.FocusTimePotential />
    </React.Fragment>
  ))
  .add('Card with Header', () => (
    <Card onDismiss style={{height: 186}}>
      <Card.Header icon={<CategoryIcon.Assistant />} text="Assistant" />
    </Card>
  ))
  .add('Error Message', () => (
    <Card onDismiss>
      <ErrorMessage>
        An error occurred. <ErrorMessage.Retry onClick={() => console.log('Retry pressed')}>Retry?</ErrorMessage.Retry>
      </ErrorMessage>
    </Card>
  ))
  .add('Card Divider', () => (
    <Card.Divider />
  ));

class CardSimulation extends Component {
  toggle () {
    action('Clicked');
  }

  render () {
    return (
      <Card onDismiss={() => this.toggle()} style={{height: 186}} />
    );
  }
}`


const stories = getStories(input2)

stories.forEach(story => {
  const line = story.location.end.line;
  // Subtract 3 since we know the identifier is `add` which is 3 letters long.
  // This will point us to the start of the expression's column.
  const column = story.location.end.column - 3;

  const res = printAsError(input, line, column);
  console.log(`"${story.kind}", ${story.story}`)
  console.log(res)
  console.log('')
});
