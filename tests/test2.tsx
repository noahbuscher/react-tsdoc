import React from 'react';

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

export default Button;
