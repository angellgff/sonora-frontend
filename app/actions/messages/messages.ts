"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePathUrl } from "@/app/_helpers/revalidatePathUrl";
import { Message, PaginatedMessages } from "./types";

export async function saveMessage(message: Message) {
  try {
    const supabase = await createClient();
    await supabase.from("messages").insert({
      conversation_id: message.conversation_id,
      user_id: message.user_id,
      text_content: message.text_content,
      type: message.type,
      role: message.role,
    });
    revalidatePathUrl();
  } catch (error) {
    console.error("Error saving message:", error);
    throw new Error("Failed to save message");
  }
}

export async function getMessages(conversation_id: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation_id);
    if (error) {
      throw new Error(error.message);
    }
    return data;
  } catch (error) {
    console.error("Error getting messages:", error);
    throw new Error("Failed to get messages");
  }
}

export async function getConversationMessages(
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<PaginatedMessages> {
  try {
    console.log("DEBUG: Using direct supabase-js client for getConversationMessages");

    // Fallback to direct client to avoid potential SSR/Fetch issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials in env");
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

    const {
      data: messages,
      error,
      count,
    } = await supabase
      .from("messages")
      .select("*", { count: "exact" })
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error al obtener mensajes:", error);
      throw new Error(error.message);
    }

    const total = count || 0;
    const hasMore = offset + limit < total;
    const nextOffset = offset + limit;
    const mappedMessages = messages?.map((msg) => ({
      ...msg,
      text_content: msg.content, // Map content to text_content as expected by frontend
    })) || [];

    return {
      messages: mappedMessages as Message[],
      total,
      hasMore,
      nextOffset,
    };
  } catch (error: any) {
    console.error("Error getting conversation messages:", error);
    if (error?.cause) console.error("Cause:", error.cause);
    if (error?.stack) console.error("Stack:", error.stack);
    throw new Error(`Failed to get conversation messages: ${error?.message || "Unknown error"}`);
  }
}
