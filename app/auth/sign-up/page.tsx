import { redirect } from "next/navigation";

// El registro público está deshabilitado: las cuentas las crea el
// administrador desde /admin/users. Si alguien llega a esta URL,
// lo mandamos al login.
export default function SignUpDisabled() {
  redirect("/auth/login");
}
