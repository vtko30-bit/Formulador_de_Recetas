# Configuración de Auth en Supabase (login / crear cuenta)

## 1. Si al entrar o crear cuenta "no pasa nada"

### Desactivar confirmación de correo (recomendado para pruebas)

Si **Confirm email** está activado, tras "Crear cuenta" debes abrir el correo y hacer clic en el enlace antes de poder iniciar sesión. Si no quieres eso:

1. En Supabase: **Authentication** → **Providers** → **Email**.
2. Busca **"Confirm email"** y **desactívalo** (toggle OFF).
3. Guarda. A partir de ahí, al crear cuenta podrás entrar sin confirmar por correo.

---

## 2. "Leaked Password Protection Disabled"

Esa observación indica que la comprobación de contraseñas filtradas (HaveIBeenPwned) está desactivada.

- En el **plan gratuito** de Supabase esta opción suele estar solo en planes de pago (Pro).
- **Puedes ignorar la advertencia** sin problema: la app funciona igual.
- Si en tu proyecto ves la opción para activarla: **Authentication** → **Settings** (o **Policies**) → busca algo como **"Leaked password protection"** o **"Prevent use of leaked passwords"** y actívala.

No es obligatorio resolverla para usar el Formulador de Helados.
