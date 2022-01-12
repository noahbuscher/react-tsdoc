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
		defaultExport = exported.find((node) => {
			try {
				// @ts-ignore
				return node.isDefaultExport();
			} catch {
				return false;
			}
		});
	});

	return defaultExport;
}
