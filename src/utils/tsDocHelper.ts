import { Node } from 'ts-morph';
import * as tsdoc from '@microsoft/tsdoc';
import { getComponentInitializer } from './reactComponentHelper';

/**
 * Find comment ranges for the React AST node
 *
 * @param node - The current AST node
 */
export const findCommentRanges = (node: Node): tsdoc.TextRange[] => {
	const commentRanges = node.getLeadingCommentRanges();

	if (commentRanges.length) {
		const commentStrings = commentRanges.map((range) =>
			tsdoc.TextRange.fromStringRange(
				node.getSourceFile().getFullText(),
				range.getPos(),
				range.getEnd()
			)
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
export const parseTSDoc = (comment: tsdoc.TextRange): tsdoc.DocComment => {
	const tsDocConfiguration: tsdoc.TSDocConfiguration = new tsdoc.TSDocConfiguration();

	const propBlockDefinition: tsdoc.TSDocTagDefinition = new tsdoc.TSDocTagDefinition({
		tagName: '@prop',
		syntaxKind: tsdoc.TSDocTagSyntaxKind.BlockTag
	});

	tsDocConfiguration.addTagDefinitions([
		propBlockDefinition
	]);

	const tsdocParser: tsdoc.TSDocParser = new tsdoc.TSDocParser(tsDocConfiguration);
	const parserContext: tsdoc.ParserContext = tsdocParser.parseRange(comment);
	const docComment: tsdoc.DocComment = parserContext.docComment;

	if (parserContext.log.messages.length > 0) {
		for (const message of parserContext.log.messages) {
			throw Error(message.text);
		}
	}

	return docComment;
}

/**
 * Gets the TSDoc node's content (no API support yet)
 *
 * @param node - The current AST node
 */
export const renderPropBlock = (node: tsdoc.DocNode): {propName: string, content: string}|undefined => {
	if (node instanceof tsdoc.DocPlainText) {
		return {
			propName: node.text.split(' - ')[0].trim(),
			content: node.text.split(' - ')[1].trim()
		}
	}

	for (const childNode of node.getChildNodes()) {
		return renderPropBlock(childNode);
	}

	return undefined;
}

/**
 * Returns the text of the summary for a given comment block
 *
 * @param comment - The comment to render
 */
export const renderCommentSummary = (comment: tsdoc.DocComment): string => {
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
export const getDeclarationDescription = (node: Node): string => {
	const commentRanges = findCommentRanges(<Node>getComponentInitializer(node));

	if (commentRanges.length) {
		return renderCommentSummary(parseTSDoc(commentRanges[0]));
	}

	return '';
}

/**
 * Gets comments for props
 *
 * @node - The node to parse comments out of
 */
export const getPropBlocks = (node: Node): readonly tsdoc.DocBlock[] => {
	const commentRanges = findCommentRanges(<Node>getComponentInitializer(node));

	if (commentRanges.length) {
		const comments = parseTSDoc(commentRanges[0]);

		return comments.customBlocks;
	}

	return [];
}
