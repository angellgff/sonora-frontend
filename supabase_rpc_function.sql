-- Función RPC para obtener conversaciones con el último mensaje
-- Esta función debe ejecutarse en el SQL Editor de Supabase

-- Eliminar la función existente si existe
DROP FUNCTION IF EXISTS get_conversations_with_last_message(UUID);

-- Crear la función con la nueva firma
CREATE OR REPLACE FUNCTION get_conversations_with_last_message(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  created_at TIMESTAMPTZ,
  user_id UUID,
  last_message_content TEXT,
  last_message_role TEXT,
  last_message_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.created_at,
    c.user_id,
    m.content AS last_message_content,
    m.role AS last_message_role,
    m.msg_created_at AS last_message_created_at
  FROM conversations c
  LEFT JOIN LATERAL (
    SELECT 
      messages.content, 
      messages.role, 
      messages.created_at AS msg_created_at
    FROM messages
    WHERE messages.conversation_id = c.id
      AND messages.deleted_at IS NULL
    ORDER BY messages.created_at DESC
    LIMIT 1
  ) m ON true
  WHERE c.user_id = p_user_id
    AND c.deleted_at IS NULL
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
