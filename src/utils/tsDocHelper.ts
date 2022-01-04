import { Node, SyntaxKind } from 'ts-morph';
import * as tsdoc from '@microsoft/tsdoc';

/**
 * Find comment ranges for the React AST node
 *
 * @param node - The current AST node
 */
const findCommentRanges = (node: Node) => {
	const commentRanges = node.getLeadingCommentRanges();

	if (commentRanges?.length) {
		const commentStrings = commentRanges.map((range) =>
			tsdoc.TextRange.fromStringRange(node.getSourceFile().getFullText(), range.getPos(), range.getEnd())
		);

		return commentStrings;
	}

	return [];
}

/**
 * Parses the comment from the range
 *
 * @param comment - The object containing the comment range
 */
const parseTSDoc = (comment: any) => {
	const tsdocParser: tsdoc.TSDocParser = new tsdoc.TSDocParser();
	const parserContext: tsdoc.ParserContext = tsdocParser.parseRange(comment);
	const docComment: tsdoc.DocComment = parserContext.docComment;

	if (parserContext.log.messages.length === 0) {
		// console.log('No TSDoc errors or warnings.');
	} else {
		for (const message of parserContext.log.messages) {
			console.log('Errors parsing TSDoc: ', message);
		}
	}

	return docComment;
}

/**
 * Gets the TSDoc node's content (no API support yet)
 *
 * @param node - The current AST node
 */
// @ts-ignore
export const renderParamBlock = (node: any) => {
	if (node instanceof tsdoc.DocPlainText) {
		return node.text;
	} else {

	}

	for (const childNode of node.getChildNodes()) {
		return renderParamBlock(childNode);
	}
}

/**
 * Returns the text of the summary for a given comment block
 *
 * @param comment - The comment to render
 */
const renderCommentSummary = (comment: tsdoc.DocComment) => {
	return comment.summarySection
		.getChildNodes()[0] // Grabs the summary nodes
		// @ts-ignore
		.getChildNodes()[0].text // Grabs text of the Paragraph node
}

/**
 * Get declaration description
 *
 * @param node - The node to grab the declaration description from
 */
export const getDeclarationDescription = (node: Node) => {
	// Add descriptions for documented params
	const commentRanges = findCommentRanges(
		// @ts-ignore
		node.getKind() === SyntaxKind.FunctionDeclaration
			? node
			// Comment ranges are not on the ArrowFunction
			: node?.getFirstAncestorByKind(SyntaxKind.VariableStatement)
	);

	return renderCommentSummary(parseTSDoc(commentRanges[0]));
}

/**
 * Gets comments for params
 *
 * @node - The node to parse comments out of
 */
export const getParamComments = (node: Node) => {
	// Add descriptions for documented params
	const commentRanges = findCommentRanges(
		// @ts-ignore
		node.getKind() === SyntaxKind.FunctionDeclaration
			? node
			// Comment ranges are not on the ArrowFunction
			: node?.getFirstAncestorByKind(SyntaxKind.VariableStatement)
	);

	return parseTSDoc(commentRanges[0]).params.blocks;
}