import { PropertySignature, SyntaxKind } from 'ts-morph';

const SimpleTypes = [
	'string',
	'number',
	'boolean',
	'any',
	'void',
	'object',
	'class'
];

/**
 * Gets type data for a param
 */
export const getTypeSignature = (node: PropertySignature) => {
	const typeText = node.getType().getText().toString();

	// Literals
	if (node.getTypeNode()?.getKind() === SyntaxKind.LiteralType) {
		return {
			name: 'literal',
			value: typeText
		}
	}

	// Simple types
	if (SimpleTypes.includes(typeText)) {
		return {
			name: typeText
		}
	}

	return {
		name: 'unknown'
	};
};
