import { PropertySignature, SyntaxKind } from 'ts-morph';

const SimpleTypes = [
	'string',
	'number',
	'boolean',
	'any',
	'void',
	'String',
	'Object'
];

interface TypeSignature {
	name: string,
	value?: string
}

/**
 * Gets type data for a param
 */
export const getTypeSignature = (node: PropertySignature): TypeSignature => {
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
