const {printAsError} = require('./utils');
const lineColumn = require("line-column");
const {getStories} = require('./story-parser-acorn');

const input = `import React, {Component} from 'react';
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


const stories = getStories(input);
const locations = lineColumn(input);

stories.forEach(story => {
  const endLocations = locations.fromIndex(story.location.end);
  const line = endLocations.line;
  // Subtract 3 since we know the identifier is `add` which is 3 letters long.
  // This will point us to the start of the expression's column.
  const column = endLocations.col - 3;

  const res = printAsError(input, line, column);

  console.log(`"${story.kind}", ${story.story}`)
  console.log(res)
  console.log('')
});