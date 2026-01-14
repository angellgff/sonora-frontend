-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Crear bucket para audios de mensajes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-audios',
  'message-audios',
  false,
  52428800, -- 50MB en bytes
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/aac']
);

-- Crear bucket para imágenes de mensajes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-images',
  'message-images',
  false,
  10485760, -- 10MB en bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- ============================================
-- POLÍTICAS DE STORAGE - AUDIOS
-- ============================================

-- Los usuarios pueden subir sus propios audios
-- Estructura de ruta esperada: {user_id}/{conversation_id}/{filename}
CREATE POLICY "Los usuarios pueden subir sus propios audios"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-audios' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden leer sus propios audios
CREATE POLICY "Los usuarios pueden leer sus propios audios"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-audios' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden actualizar sus propios audios
CREATE POLICY "Los usuarios pueden actualizar sus propios audios"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'message-audios' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden eliminar sus propios audios
CREATE POLICY "Los usuarios pueden eliminar sus propios audios"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-audios' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- POLÍTICAS DE STORAGE - IMÁGENES
-- ============================================

-- Los usuarios pueden subir sus propias imágenes
-- Estructura de ruta esperada: {user_id}/{conversation_id}/{filename}
CREATE POLICY "Los usuarios pueden subir sus propias imágenes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden leer sus propias imágenes
CREATE POLICY "Los usuarios pueden leer sus propias imágenes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden actualizar sus propias imágenes
CREATE POLICY "Los usuarios pueden actualizar sus propias imágenes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'message-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden eliminar sus propias imágenes
CREATE POLICY "Los usuarios pueden eliminar sus propias imágenes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

