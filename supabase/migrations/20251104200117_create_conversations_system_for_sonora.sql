-- ============================================
-- TABLA: conversations
-- ============================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT, -- Título opcional de la conversación
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Índices para mejor rendimiento
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_deleted_at ON conversations(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: messages
-- ============================================
CREATE TYPE message_type AS ENUM ('text', 'audio', 'text_with_images', 'audio_with_images');

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type message_type NOT NULL DEFAULT 'text',
  text_content TEXT, -- Contenido del mensaje de texto
  audio_file_path TEXT, -- Referencia al archivo de audio en Storage
  audio_duration_seconds INTEGER, -- Duración del audio en segundos (opcional)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Índices
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_deleted_at ON messages(deleted_at) WHERE deleted_at IS NULL;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: message_images
-- ============================================
CREATE TABLE message_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  image_file_path TEXT NOT NULL, -- Referencia al archivo en Storage
  image_order INTEGER NOT NULL DEFAULT 0, -- Orden de las imágenes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Índices
CREATE INDEX idx_message_images_message_id ON message_images(message_id);
CREATE INDEX idx_message_images_order ON message_images(message_id, image_order);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_images ENABLE ROW LEVEL SECURITY;

-- Políticas para conversations
CREATE POLICY "Los usuarios pueden ver sus propias conversaciones"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propias conversaciones"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias conversaciones"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias conversaciones"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para messages
CREATE POLICY "Los usuarios pueden ver mensajes de sus conversaciones"
  ON messages FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios pueden crear mensajes en sus conversaciones"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios pueden actualizar sus propios mensajes"
  ON messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios mensajes"
  ON messages FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para message_images
CREATE POLICY "Los usuarios pueden ver imágenes de sus mensajes"
  ON message_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_images.message_id
      AND messages.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios pueden crear imágenes en sus mensajes"
  ON message_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_id
      AND messages.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios pueden eliminar imágenes de sus mensajes"
  ON message_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_images.message_id
      AND messages.user_id = auth.uid()
    )
  );