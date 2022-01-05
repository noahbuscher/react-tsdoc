import {
	SyntaxKind,
	Node,
	FunctionDeclaration,
	ArrowFunction,
	VariableStatement,
} from 'ts-morph';

/**
 * Checks if a given declaration is a React component
 *
 * @param node - The node to check
 */
export const isReactComponent = (node: Node): boolean => {
	if (node.getKind() === SyntaxKind.VariableDeclaration || node.getKind() === SyntaxKind.FunctionDeclaration) {

		// @ts-ignore
		const name = node.getName();

		if (!name) throw Error;

		return name[0] === name[0].toUpperCase();
	}

	return false;
}

/**
 * Evaluates a node and returns the function declaration or variable statement
 *
 * @param node - The node to search
 */
export const getComponentInitializer = (node: Node): FunctionDeclaration|VariableStatement|undefined => {
	if (node.getKind() === SyntaxKind.FunctionDeclaration) {
		return <FunctionDeclaration>node;
	}

	return node?.getFirstAncestorByKindOrThrow(SyntaxKind.VariableStatement);
}

/**
 * Gets the function for a given component
 *
 * @param node - The node to evaluate
 */
export const getComponentFunction = (node: Node|FunctionDeclaration): FunctionDeclaration|ArrowFunction|undefined => {
	if (node.getKind() === SyntaxKind.FunctionDeclaration) {
		return <FunctionDeclaration>node;
	}

	return node.getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction);
}
