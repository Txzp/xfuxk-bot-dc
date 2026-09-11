# XZEBroker Discord Bot

Bot básico para Discord con comandos de moderación y utilidades.

Invitar el bot al servidor:

`https://discord.com/oauth2/authorize?client_id=1529558164544946288&scope=bot%20applications.commands&permissions=8`

La persona que use el enlace debe tener permiso **Gestionar servidor** o ser propietaria del servidor. En la pantalla de Discord selecciona el servidor nuevo y pulsa **Continuar** y **Autorizar**.

Instalación:

```bash
npm install
cp .env.example .env
# editar .env con tu TOKEN y configuración
npm start
```

Registrar slash commands (opcional, recomendado para comandos /):

1. Añade `CLIENT_ID` y opcionalmente `GUILD_ID` en tu `.env`.
2. Ejecuta para registrar en un servidor de pruebas (rápido):

```bash
node ./scripts/deploy-commands.js <GUILD_ID>
# o sin argumento para registro global (tarda hasta 1 hora)
node ./scripts/deploy-commands.js
```

Nota: si ves "The application did not respond" al usar un comando de aplicación (/), asegúrate de reiniciar el bot después de registrar los comandos y de que el bot esté online.

Comandos disponibles (prefijo por defecto `!`):
- `!ping` - Latencia
- `!about @usuario` - Información del usuario
- `!kick @usuario [razón]` - Expulsar (requiere permisos)
- `!ban @usuario [razón]` - Banear (requiere permisos)
- `!quiz` - Pequeño quiz interactivo
- `!ticket` - Crear un ticket privado
- `!lock` - Bloquear canal para @everyone
- `!reactionrole <emoji> @role` - Crea mensaje de reacción para obtener rol
- `!embed` - Crear un mensaje embed sencillo

Eventos:
- Al entrar un nuevo miembro se le asigna el rol `MEMBER_ROLE_NAME` configurado en `.env` y se le da la bienvenida en el canal `WELCOME_CHANNEL_NAME`.
