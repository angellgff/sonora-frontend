-- Migración para evitar mensajes duplicados ACCIDENTALES
-- Usa trigger en lugar de columna generada para evitar problemas de inmutabilidad

-- IMPORTANTE: Primero eliminar índices anteriores si existen
DROP INDEX IF EXISTS idx_unique_message_text_per_conversation;
DROP INDEX IF EXISTS idx_unique_message_audio_per_conversation;

-- Agregar columna para almacenar el minuto del mensaje
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS created_minute TIMESTAMPTZ;

-- Crear función que establece el minuto cuando se inserta un mensaje
CREATE OR REPLACE FUNCTION set_message_created_minute()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_minute := DATE_TRUNC('minute', NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que ejecuta la función antes de insertar
DROP TRIGGER IF EXISTS trg_set_created_minute ON messages;
CREATE TRIGGER trg_set_created_minute
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION set_message_created_minute();

-- Índice único: mismo mensaje, mismo usuario, mismo minuto = duplicado accidental
CREATE UNIQUE INDEX idx_prevent_accidental_duplicate_text
ON messages (
  conversation_id, 
  user_id, 
  text_content, 
  created_minute
) 
WHERE text_content IS NOT NULL AND deleted_at IS NULL;

-- Lo mismo para mensajes de audio
CREATE UNIQUE INDEX idx_prevent_accidental_duplicate_audio
ON messages (
  conversation_id, 
  user_id, 
  audio_file_path, 
  created_minute
) 
WHERE audio_file_path IS NOT NULL AND deleted_at IS NULL;

COMMENT ON COLUMN messages.created_minute IS 
'Timestamp truncado al minuto (establecido por trigger), usado para prevenir duplicados accidentales';

COMMENT ON INDEX idx_prevent_accidental_duplicate_text IS 
'Previene duplicados accidentales: mismo texto del mismo usuario en el mismo minuto';

COMMENT ON INDEX idx_prevent_accidental_duplicate_audio IS 
'Previene duplicados accidentales: mismo audio del mismo usuario en el mismo minuto';