
# How to use

```js
const {getStories} = require('./story-parser-acorn');

const stories = getStories(fileAsString);
// [
//   {
//     kind: 'Card',
//     story: 'Basic',
//     location: { line: 10, column: 4 }
//   },
//   {
//     kind: 'Card/Atoms',
//     story: 'Card Divider',
//     location: { line: 67, column: 4 }
//   },
//   // ...
// ]

```

# Overview

Shift AST spec is the best one out there (in my opinion). Downside is there isn't a huge amount of community behind it. This means there aren't a lot of plugins, and so parsing JSX is extremely difficult.

Acorn is alright and way more popular; I think this is what Babel uses under the hood in many places. It's easy to parse JSX as well using one of their plugins.

Because of those two reasons, we use Acorn for this job. Luckily, the difference is very subtle in our traversing strategy, but getting locations is a bit more involved (not too complicated though).

# Traversing Algorithm

The overall traversing algorithm for both Shift and Acorn AST's; note that they are almost identical (luckily).

## Shift Parser

Look for a `CallExpression` and enter this recursive routine:

(1) Looking at a `CallExpression`
```
callee     ->   If `StaticMemberExpression`, then proceed to step (2)
                  This being a `StaticMemberExpression` is a candidate for `add` because `add` cannot be called on its own
callee     ->   If `IdentifierExpression`, then proceed to step (3)
                  This being a `IdentifierExpression` is a candidate for `storiesOf`
arguments  ->   the arguments to the function call, aka our "Story" or our "Kind"
```

(2) Then we enter the `callee` which is a `StaticMemberExpression`
```
object    ->  if `CallExpression`, repeat logic above for `CallExpression`
property  ->  must be `add` or else this node isn't useful to us
```

(3) Then we enter the `callee` which is an `IdentifierExpression`
```
name  ->  must be `storiesOf` or else this node isn't useful to us
```


## Acorn Parser

Look for a `CallExpression` and enter this recursive routine:

(1) Looking at a `CallExpression`
```
callee     ->   If `MemberExpression`, then proceed to step (2)
                  This being a `MemberExpression` is a candidate for `add` because `add` cannot be called on its own
callee     ->   If `Identifier`, then proceed to step (3)
                  This being a `Identifier` is a candidate for `storiesOf`
arguments  ->   the arguments to the function call, aka our "Story" or our "Kind"
```

(2) Then we enter the `callee` which is a `MemberExpression`
```
object    ->  if `CallExpression`, repeat logic above for `CallExpression`
property  ->  must be `add` or else this node isn't useful to us
```

(3) Then we enter the `callee` which is an `Identifier`
```
name  ->  must be `storiesOf` or else this node isn't useful to us
```
