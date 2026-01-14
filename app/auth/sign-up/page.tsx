import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050B14] font-sans text-slate-200 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E599]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B82F6]/10 rounded-full blur-[150px] pointer-events-none"></div>

      <SignUpForm />
    </div>
  );
}
