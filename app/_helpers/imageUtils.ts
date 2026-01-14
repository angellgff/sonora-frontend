/**
 * Redimensiona y comprime una imagen para enviarla eficientemente.
 * @param file Archivo de imagen original
 * @param maxWidth Ancho máximo permitido (default 1024px)
 * @param quality Calidad JPEG (0 a 1, default 0.8)
 * @returns Promesa con el string Base64 optimizado
 */
export const compressImageToBase64 = (
    file: File,
    maxWidth: number = 512,
    quality: number = 0.6
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // Redimensionar si excede el ancho máximo
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("No se pudo obtener el contexto del canvas"));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Convertir a JPEG con compresión
                const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
                resolve(compressedBase64);
            };

            img.onerror = (error) => reject(error);
        };

        reader.onerror = (error) => reject(error);
    });
};
