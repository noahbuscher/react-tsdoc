import React from 'react';
import { TextFieldProps } from './types';

/**
 * Testing
 *
 * @param disabled - Sets if field is disabled
 * @param onChange - Callback for when the field value is changed
 * @param placeholder - Placeholder for the field
 * @param value - Sets the field's value
 */
const TextField = ({
	disabled = false,
	onChange = (e) => {console.log(e)},
	placeholder = 'Default placeholder text',
	value
}: TextFieldProps) => {
	return (
		<input
			value={value}
			type="text"
			placeholder={placeholder}
			onChange={onChange}
		/>
	)
};

export default TextField;
