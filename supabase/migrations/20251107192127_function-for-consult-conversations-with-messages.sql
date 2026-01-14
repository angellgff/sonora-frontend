CREATE OR REPLACE FUNCTION get_conversations_with_last_message(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_message_id UUID,
  last_message_text TEXT,
  last_message_role TEXT,
  last_message_type TEXT,
  last_message_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.title,
    c.created_at,
    c.updated_at,
    m.id as last_message_id,
    m.text_content as last_message_text,
    m.role::TEXT as last_message_role,
    m.type::TEXT as last_message_type,
    m.created_at as last_message_created_at
  FROM conversations c
  INNER JOIN LATERAL (  -- ✅ INNER JOIN: Solo conversaciones con mensajes
    SELECT 
      msg.id,
      msg.text_content,
      msg.role::TEXT as role,
      msg.type,
      msg.created_at
    FROM messages msg
    WHERE msg.conversation_id = c.id
      AND msg.deleted_at IS NULL
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) m ON true
  WHERE c.user_id = p_user_id
    AND c.deleted_at IS NULL
    AND c.title IS NOT NULL          -- ✅ NUEVO: Título no es NULL
    AND TRIM(c.title) != ''          -- ✅ NUEVO: Título no está vacío
  ORDER BY 
    m.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;