/**
 * @param disabled - Sets if field is disabled
 * @param onChange - Callback for when the field value is changed
 * @param placeholder - Placeholder for the field
 * @param value - Sets the field's value
 */
interface TextFieldProps {
	disabled?: boolean
	onChange: any
	placeholder?: string
	value: string
}

/**
 * Just a basic text field
 */
const TextField = ({
	disabled = false,
	onChange = (e) => {console.log(e)},
	placeholder = 'Default placeholder text',
	value
}: TextFieldProps) => (
	<input
		value={value}
		type="text"
		placeholder={placeholder}
		onChange={onChange}
	>
	</input>
);

export default TextField;
