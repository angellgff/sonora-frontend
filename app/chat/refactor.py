import re

filepath = r'c:\\Users\\luisf\\ProyectosPython\\bot-sonora\\sonora-frontend\\app\\home-test\\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('selectedAgentId', 'agentId')

# Find and eliminate selector div
start_idx = content.find('{/* Selector de Agente */}')
if start_idx != -1:
    end_idx = content.find('</div>', start_idx) + 6
    if end_idx != 5: # not -1 + 6
        content = content[:start_idx] + content[end_idx:]

content = content.replace('export default function ChatPage() {', '''export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060D17] flex items-center justify-center text-[#00E599]">Cargando chat...</div>}>
      <ChatContent />
    </Suspense>
  )
}

function ChatContent() {''')

content = content.replace('const [agentId, setagentId] = useState<string | null>(null);', '''  const searchParams = useSearchParams();
  const agentId = searchParams.get("agentId");''')

content = content.replace('useConversation();', 'useConversation(agentId);')

content = content.replace('import { useRouter } from "next/navigation";', '''import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";''')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
