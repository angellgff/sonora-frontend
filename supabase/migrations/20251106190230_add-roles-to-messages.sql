-- ============================================
-- AGREGAR CAMPO ROLE A MESSAGES
-- ============================================

-- Crear tipo ENUM para el rol del mensaje
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- Agregar columna role a la tabla messages
ALTER TABLE messages 
ADD COLUMN role message_role NOT NULL DEFAULT 'user';

-- Crear índice para mejorar consultas por role
CREATE INDEX idx_messages_role ON messages(role);

-- Comentario para documentar el campo
COMMENT ON COLUMN messages.role IS 'Identifica el remitente del mensaje: user (usuario), assistant (agente/IA), system (sistema)';