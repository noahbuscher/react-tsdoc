<div style="text-align: center;">
  <img src="./logo.png" width="200px"/>
</div>


# react-tsdoc

react-tsdoc is an WIP tool to extract information from React Typescript component
files with [TSDoc](https://tsdoc.org) for documentation generation purposes that
elaborates on the TSDoc standard; in fact, it's based on the `@microsoft/tsdoc`
parser.

Instead of doing traditional [interface documentation](https://github.com/microsoft/tsdoc/issues/246#issuecomment-661581283),
react-tsdoc opts in for a custom TSDoc tag named `@prop` which allows you to
document a component like the following:

```tsx
/**
 * Awesome button
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

_or_

```tsx
interface ButtonProps {
  label: string
};

/**
 * Awesome button
 *
 * @prop label - Sets the button text
 */
const Button = ({
  label
}: ButtonProps) => (
  <button>{label}</button>
);
```

> Similar to [react-docgen](https://github.com/reactjs/react-docgen), react-tsdoc
is a low level tool to extract information about React components. I am currently
working on a Babel plugin that works with this project to integrate with Storybook.

### Install

To install `react-tsdoc` just run:

```
npm install react-tsdoc
```

Example parser command:

```
react-tsdoc ./src/components --output ./docs/output.json
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

### Output

Here's an example component with the associated parser output...

#### Input

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

#### Output

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

### Development

I've heavily commented a lot of the functions as this has been an AST learning
experience for me, and I hope others find it easy to understand and contribute.

To build, just run
```
npm install && npm run build
```

This will build the `./lib` folder and then you can execute the CLI from the `/bin`
directory, like this:

```
bin/react-tsdoc.js ./src/components ./output.json && cat ./output.json
```
