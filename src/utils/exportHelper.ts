import { ExportedDeclarations, SourceFile } from 'ts-morph';

/**
 * Gets the default export (if any) from a file
 *
 * @param sourceFile - The file to extract the default export from
 */
export const getDefaultExport = (sourceFile: SourceFile) => {
	const exportedDeclarations = sourceFile.getExportedDeclarations();
	let defaultExport = undefined;

	exportedDeclarations.forEach((exported: ExportedDeclarations[]) => {
		// @ts-ignore
		defaultExport = exported.find((node) => node.isDefaultExport());
	});

	return defaultExport;
}
