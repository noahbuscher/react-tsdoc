import React from 'react'

/**
 * Just a basic text field
 *
 * @param placeholder - Placeholder for the field
 * @param value - Sets the field's value
 */
const TextField = ({
	disabled = false,
	onChange = (e) => {console.log(e)},
	placeholder = 'Default placeholder text',
}: {
	disabled?: boolean
	onChange: any
	placeholder?: string
}) => (
	<input value={value} type="text" placeholder={placeholder}></input>
);
