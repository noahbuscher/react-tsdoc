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
export const getFunctionDecOrVariableStatement = (node: Node) =>
	node.getKind() === SyntaxKind.FunctionDeclaration
		? node
		// Comment ranges are not on the ArrowFunction
		: node?.getFirstAncestorByKind(SyntaxKind.VariableStatement);
