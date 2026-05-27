import { redirect } from "next/navigation";

// Registro público deshabilitado — ver app/auth/sign-up/page.tsx.
export default function SignUpSuccessDisabled() {
  redirect("/auth/login");
}
