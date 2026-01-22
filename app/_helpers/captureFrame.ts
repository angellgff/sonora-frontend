"use client";

/**
 * Captura un frame del video stream y lo retorna como base64.
 */
export async function captureFrameFromStream(stream: MediaStream | null): Promise<string | null> {
    if (!stream) return null;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return null;

    try {
        // Crear un video element temporal
        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;

        // Esperar a que el video esté listo
        await new Promise<void>((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });

        // Esperar un frame
        await new Promise(resolve => setTimeout(resolve, 100));

        // Crear canvas y capturar
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Parar el video temporal
        video.pause();

        // Convertir a base64 sin el prefijo data:image/jpeg;base64,
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        const base64 = dataUrl.split(",")[1];

        console.log("📷 Frame capturado:", base64.length, "chars");
        return base64;
    } catch (err) {
        console.error("Error capturando frame:", err);
        return null;
    }
}
