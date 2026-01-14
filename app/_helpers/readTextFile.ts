/**
 * Lee el contenido de un archivo de texto.
 */
export async function readTextFile(file: File): Promise<{ content: string; name: string }> {
    const supportedExtensions = [".txt", ".md", ".json"];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!supportedExtensions.includes(extension)) {
        throw new Error(`Formato no soportado: ${extension}. Usa archivos .txt, .md o .json`);
    }

    const content = await file.text();

    if (!content.trim()) {
        throw new Error("El archivo esta vacio");
    }

    const MAX_SIZE = 500 * 1024;
    if (file.size > MAX_SIZE) {
        throw new Error("El archivo es muy grande. Maximo 500KB");
    }

    return { content, name: file.name };
}

export function isTextFile(file: File): boolean {
    const supportedExtensions = [".txt", ".md", ".json"];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    return supportedExtensions.includes(extension);
}

export function isImageFile(file: File): boolean {
    return file.type.startsWith("image/");
}