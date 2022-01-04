# react-tsdocgen

react-tsdocgen (succinct name, I know) is an experimental CLI to extract information
from React Typescript component files with TSDoc for documentation generation purposes
that strictly adheres to the TSDoc standard; in fact, it's based on the `@microsoft/tsdoc`
parser. Ergo, it may not play super nice with JSDoc comments. If you get burned, don't
say I didn't warn you.

### Install

To install `react-tsdocgen` just run:

```
npm install react-tsdocgen
```

Example parser command:

```
react-tsdocgen ./src/components --output ./docs/output.json
```

### Another Docgen?

While it might not seem like there's room for yet another docgen, there
does not appear to exist a solution right now that is legitimately TSDoc-adherent
so hear me out.

Though `react-docgen`, `typedoc`, and `react-docgen-typescript` are all wonderful
tools, none of them are based on the TSDoc standard, leading to some frustrating
small learning curves.

As [Shilman](https://gist.github.com/shilman)
of Storybook noted in
[this Gist](https://gist.github.com/shilman/036313ffa3af52ca986b375d90ea46b0),
Storybook plans to adopt `react-docgen` for SB7, however `react-docgen` is based
on an outdated Doc parser (`doctrine`) and does _not_ support the TSDoc standard.

Ultimately, this is just an excuse for me to play around with ASTs, but I hope
others find some use in this project.

### Behavior

#### Property Signature Comments

"Inline" _property signature_ comments are ignored by this tool, as they are not part
of the (let's say it together) TSDoc spec.

For instance, consider the following component:

```tsx
/**
 * Just a basic text field
 *
 * @param value - Sets the field's value
 */
const TextField = ({
	placeholder = 'Default placeholder text',
	value,
}: {
	placeholder?: string

	/**
	 * Am I the captain now?
	 */
	value: string
}) => {
	return (
		<input type="text" value={value} placeholder={placeholder}/>
	);
}
```

Even though the description for the `value` param is defined in the initial block,
_and in the_ property signature, as the property signature comments are not part
of the spec, they will be ignored by the docgen.

Other things the docgen picks up that are inferred from TS are:

- Required status of params
- Default param values
- Param types (soon)

### Output

Here's an example component with the associated parser output...

#### Input

```tsx
/**
 * Button
 *
 * @param disabled - Sets if field is disabled
 * @param label - Sets the button text
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

Coming soon...
