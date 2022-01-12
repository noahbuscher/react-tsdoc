<div align="center">
  <img src="./logo.png" width="200px"/><br/>
  <i>:sparkles: Document React components with <code>@prop</code> :sparkles:</i>
</div>


# react-tsdoc

react-tsdoc is an WIP tool to extract information from React Typescript component
files with [TSDoc](https://tsdoc.org) for documentation generation purposes that
elaborates on the TSDoc standard; in fact, it's based on the `@microsoft/tsdoc`
parser.

Instead of doing traditional [interface documentation](https://github.com/microsoft/tsdoc/issues/246#issuecomment-661581283),
react-tsdoc opts in for a custom TSDoc tag named **`@prop`** which allows you to
document a component like the following:

```tsx
/**
 * Slick button
 *
 * @prop label - Sets the button text
 */
const Button = ({
  label
}: {
  label: string
}) => (
  <button>{label}</button>
);
```

> Similar to [react-docgen](https://github.com/reactjs/react-docgen), react-tsdoc
is a low level tool to extract information about React components. I am currently
working on a Webpack loader that works with this project to integrate with Storybook.

### Install

To install `react-tsdoc` just run:

```
npm i -g react-tsdoc
```

Example parser command:

```
react-tsdoc ./src/components --output ./docs/output.json
```

### Why `@prop`?

I've seen a lot of codebases that define interfaces at the JSDoc "block" level, instead
of "inline" comments above each interface key. On a personal stylistic note, I prefer
the former, and additionally, as TSDoc does _not_ allow interface definitions at the
top-level, I didn't have much of a choice but to write my own tool.

Basically `@prop Foo - Bar` at the top of a React component would be the same as writing:

```tsx
/**
 * Bar
 */
```

At the interface level. It's not a large change and as TSDocs allows extending the
types via `tsdoc.json` file, it should still be pretty happy.

Of course, you'll still want to use normal "inline" interface descriptions for your
more (not React component) interfaces.

### Output

Here's an example component with the associated parser output...

##### Input

```tsx
/**
 * Button
 *
 * @prop disabled - Sets if field is disabled
 * @prop label - Sets the button text
 */
const Button = ({
	disabled = false,
	label
}: {
	disabled?: boolean
	label: string
}) => {
	return (
		<button disabled={disabled}>
			{label}
		</button>
	)
};
```

##### Output

```json
{
  "description": "Button",
  "props": {
    "disabled": {
      "description": "Sets if field is disabled",
      "required": false,
      "tsType": {
        "name": "boolean"
      },
      "defaultValue": {
        "value": "false",
        "computed": false
      }
    },
    "label": {
      "description": "Sets the button text",
      "required": true,
      "tsType": {
        "name": "string"
      }
    }
  }
}
```

### Adding to `tsdoc.json`

Adding support for the `@prop` tag to your TSDoc config is easy! Create a `tsdoc.json`
if you don't already have one and add this to it:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
  "tagDefinitions": [
    {
      "tagName": "@prop",
      "syntaxKind": "block"
    }
  ]
}
```

### Another Docgen?

Though `react-docgen`, `typedoc`, and `react-docgen-typescript` are all wonderful
tools, defining props can be a challenge, especially if you are destructuring props.

As [Shilman](https://gist.github.com/shilman)
of Storybook noted in
[this Gist](https://gist.github.com/shilman/036313ffa3af52ca986b375d90ea46b0),
Storybook plans to adopt `react-docgen` for SB7, however `react-docgen` is based
on an outdated Doc parser (`doctrine`) and does _not_ support the TSDoc standard.

I have found that interface documentation can be rather cumbersome and being able
to see what each respective prop is used for at a glance is extremely handy.

Ultimately, this is just an excuse for me to play around with ASTs, but I hope
others find some use in this project.

### Supported Types

- [x] Simple (`foo: string`, `bar: boolean`)
- [x] Literals (`foo: 'bar'`)
- [x] Tuples (`foo: [string, number]`)
- [x] Unions (`foo: string | boolean`)
- [x] Typed arrays (`foo: string[]`)
- [x] Object signatures (`{ foo: string}`)
- [x] Index signatures (`[foo: string]: string`)
- [x] Function signatures (`foo: (x: string) => void`)
- [ ] Intersect (`foo: string & number`)
- [ ] Nullable modifier (`foo: ?number`)
- [ ] Typed classes (`foo: Class<bar>`)

_Extended support coming soon._

### Development

I've heavily commented a lot of the functions as this has been an AST learning
experience for me, and I hope others find it easy to understand and contribute.

To build, just run:

```
npm install && npm run build
```

This will build the `./lib` folder and then you can execute the CLI from the `/bin`
directory, like this:

```
bin/react-tsdoc.js ./src/components ./output.json && cat ./output.json
```

To run the tests:

```
npm run test
```
