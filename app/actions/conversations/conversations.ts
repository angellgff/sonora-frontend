"use server";

import { createClient } from "@/lib/supabase/server";
import { Conversation } from "./types";
import { revalidatePathUrl } from "@/app/_helpers/revalidatePathUrl";

const resolveUserId = async (providedId?: string) => {
  if (providedId) return providedId;

  try {
    const supabase = await createClient();
    return (await supabase.auth.getUser()).data.user?.id ?? null;
  } catch (error) {
    console.error("Error getting user id:", error);
    return null;
  }
};

export async function saveConversation(conversation: Conversation, userId?: string) {
  try {
    const targetUserId = await resolveUserId(userId);
    if (!targetUserId) throw new Error("User ID required");

    const supabase = await createClient();
    const { data } = await supabase
      .from("conversations")
      .insert({
        user_id: targetUserId,
        title: conversation.title,
      })
      .select("id")
      .single();
    revalidatePathUrl();

    return data?.id;
  } catch (error) {
    console.error("Error saving conversation:", error);
    throw new Error("Failed to save conversation");
  }
}

export async function getConversations(userId?: string) {
  try {
    const targetUserId = await resolveUserId(userId);
    if (!targetUserId) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", targetUserId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return data || [];
  } catch (error) {
    console.error("Error getting conversations:", error);
    throw new Error("Failed to get conversations");
  }
}

export async function updateConversation(conversation: Conversation) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("conversations")
      .update(conversation)
      .eq("id", conversation.id)
      .select("id")
      .single();
    revalidatePathUrl();

    return data?.id;
  } catch (error) {
    console.error("Error updating conversation:", error);
    throw new Error("Failed to update conversation");
  }
}

export async function getConversationsWithLastMessage(userId?: string) {
  try {
    const targetUserId = await resolveUserId(userId);
    if (!targetUserId) return [];

    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      "get_conversations_with_last_message",
      { p_user_id: targetUserId }
    );

    if (error) throw new Error(error.message);

    return data || [];
  } catch (error) {
    console.error("Error getting conversations with messages:", error);
    throw new Error("Failed to get conversations with messages");
  }
}

export async function getLastConversationWithUser(userId?: string) {
  try {
    const targetUserId = await resolveUserId(userId);
    if (!targetUserId) return null;

    console.log("🔍 Buscando última conversación para usuario:", targetUserId);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", targetUserId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw new Error(error.message);

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("❌ Error getting last conversation with user:", error);
    throw new Error("Failed to get last conversation with user");
  }
}

export async function deleteConversation(conversationId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("conversations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", conversationId);

    if (error) {
      console.error("Error deleting conversation:", error);
      throw new Error(error.message);
    }

    revalidatePathUrl();
    return true;
  } catch (error) {
    console.error("Error deleting conversation:", error);
    throw new Error("Failed to delete conversation");
  }
}
