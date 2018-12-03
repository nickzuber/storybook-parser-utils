## Shift Paser

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
