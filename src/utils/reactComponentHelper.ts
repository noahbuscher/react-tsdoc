import {
	SyntaxKind,
	ExportDeclaration,
	Node
} from 'ts-morph';

/**
 * Checks if a given declaration is a React component
 *
 * @param node - The node to check
 */
export const isReactComponent = (node: ExportDeclaration) => {
	if (node.getKind() === SyntaxKind.VariableDeclaration
	|| node.getKind() == SyntaxKind.FunctionDeclaration) {
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
export const getComponentInitializer = (node: Node) =>
	node.getKind() === SyntaxKind.FunctionDeclaration
		? node
		// Comment ranges are not on the ArrowFunction
		: node?.getFirstAncestorByKind(SyntaxKind.VariableStatement);

/**
 * Gets the function for a given component
 *
 * @param node - Node to evaluate
 */
export const getComponentFunction = (node: Node) =>
	node.getKind() === SyntaxKind.FunctionDeclaration
		? node
		: node.getFirstChildByKind(SyntaxKind.ArrowFunction)
