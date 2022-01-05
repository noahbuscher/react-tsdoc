import React from 'react';

/**
 * Basic button
 *
 * @param disabled - Sets if field is disabled
 * @param label - Sets the button text
 */
const Button = ({
	disabled = false,
	label
}: {
	disabled?: boolean
	label: 'hello'
}) => {
	return (
		<button disabled={disabled}>
			{label}
		</button>
	)
};

export { Button }
