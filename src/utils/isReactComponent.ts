import {
	SyntaxKind,
	ExportDeclaration,
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
