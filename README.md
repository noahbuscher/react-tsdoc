<div align="center">
  <img src="./logo.png" width="200px"/><br/>
  <i>:sparkles: Document React components with <code>@prop</code> :sparkles:</i>
</div>


# react-tsdoc 🤖

react-tsdoc is an tool to extract information from React Typescript component
files with [TSDoc](https://tsdoc.org) for documentation generation that
elaborates on the TSDoc standard. Just use `@prop`!

**Wouldn't it be nice if instead of doing this...**

```tsx
/**
 * Nice button
 */
const Button = ({
	disabled,
	label,
	onClick
}: {
	/**
	 * Disables the button
	 */
	disabled: boolean
	/**
	 * Label for the button
	 */
	label: string
	/**
	 * Fired when button clicked
	 */
	onClick: (...) => {}
}) => ();
```

**You could do this 👇 and _still_ have Storybook pick up the prop descriptions?**

```jsx
/**
 * Nice button
 *
 * @prop disabled - Disables the button
 * @prop label - Label for the button
 * @prop onClick - Fired when button clicked
 */
const Button = ({
	disabled,
	label,
	onClick
}: {
	disabled: boolean
	label: string
	onClick: (...) => {}
}) => ();

```

**That's where react-tsdoc comes in! It automatically generates documentation from the
TSDoc comment's `@prop`s while also still passing through all the other goodies you also
want to see, such as if a prop is required, types, default values, and more!**

> Similar to [react-docgen](https://github.com/reactjs/react-docgen), react-tsdoc
is a low level tool to extract information about React components. I am currently
working on a Webpack loader that works with this project to integrate with Storybook.

## Install

To install `react-tsdoc` just run:

```
npm i -g react-tsdoc
```

And you can run the parser like:

```
react-tsdoc ./src/components --output ./docs/output.json
```

## How do I use this with Storybook?

This tool just create JSON blobs with the documentation information. To use this with Storybook
you'll need to use a Webpack loader to inject this information into your story's components.

I'm currently working on said loader and should have something up soon!

## Why `@prop`?

Because it looks nicer! I personally perfer seeing the descriptions for all of my component's
props right at the top so I can get all of the information I need right at a glance.

## Why TSDoc instead of JSDoc?

Great question! Part of the beauty of Typescript is that you explicitely set types,
so why would you want to duplicate those in your docs? [TSDoc](https://tsdoc.org)
does away with that so you only need to call out your prop name and add a description. Easy!

## Output

Here's an example component with the associated parser output...

**Input:**

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

**Output:**

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

## Adding to `tsdoc.json`

Adding support for the `@prop` tag to your TSDoc config is easy! This allows your
`eslint-plugin-tsdoc` to properly parse `@prop`. Create a `tsdoc.json` if you don't
already have one and add this to it:

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

## Why another docgen?

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

## Supported Types

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

## Development

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
