# Desplegar Pixlite en Coolify

Este proyecto se despliega como un recurso **Docker Compose** en Coolify (usa `docker-compose.yml` en la raíz, que define los servicios `back` y `front`).

## 1. DNS

Antes de nada, crea en tu proveedor de DNS dos registros `A` apuntando a la IP del VPS (`147.93.3.184`):

| Host | Tipo | Valor |
|---|---|---|
| `pixlite.jose-hernandez.dev` | A | `147.93.3.184` |
| `api.pixlite.jose-hernandez.dev` | A | `147.93.3.184` |

Espera a que propaguen (puedes verificar con `dig pixlite.jose-hernandez.dev`) antes de pedirle a Coolify que emita el certificado SSL, o fallará la validación de Let's Encrypt.

## 2. Dar acceso a Coolify al repo privado

El repo `github.com/JoseHV1/pixlite` es privado. Al crear el recurso, Coolify te va a pedir una fuente de Git:

1. En Coolify, ve a **Sources** (o al crear el recurso, elige "Private Repository (with deploy key)").
2. Coolify te genera una clave pública SSH específica para esta app.
3. Copia esa clave y agrégala en GitHub como **Deploy Key**: `github.com/JoseHV1/pixlite` → Settings → Deploy keys → Add deploy key (no marques "Allow write access", solo necesita leer).
4. Vuelve a Coolify y confirma — debería poder listar branches del repo.

## 3. Crear el recurso

1. En tu proyecto de Coolify, **New Resource → Docker Compose**.
2. Repositorio: `JoseHV1/pixlite`, branch `main`.
3. **Docker Compose Location**: `docker-compose.yml` (raíz del repo — ya está ahí).
4. Coolify va a detectar los dos servicios: `back` y `front`.

## 4. Configurar cada servicio

**Servicio `back`:**
- Puerto expuesto/interno: `3000`
- Dominio: `https://api.pixlite.jose-hernandez.dev`
- Variables de entorno:
  - `CORS_ORIGIN=https://pixlite.jose-hernandez.dev`
  - `PORT=3000` (ya viene en el compose, no hace falta repetirla, pero no está de más)

**Servicio `front`:**
- Puerto expuesto/interno: `80`
- Dominio: `https://pixlite.jose-hernandez.dev`
- No necesita variables de entorno — la URL del back (`https://api.pixlite.jose-hernandez.dev`) ya quedó fija en el build de producción (`front/src/environments/environment.prod.ts`), porque Angular resuelve esto en build-time, no en runtime.

> Si en algún momento cambias el dominio del back, hay que editar `environment.prod.ts` y volver a hacer deploy del front (no basta con cambiar la env var en Coolify).

## 5. Deploy

Dale a **Deploy**. Coolify va a:
1. Clonar el repo
2. Construir las dos imágenes con los `Dockerfile` de `back/` y `front/`
3. Levantar los contenedores
4. Emitir certificados SSL (Let's Encrypt) para ambos dominios automáticamente, una vez que el DNS ya resuelva

## 6. Verificar

```bash
curl -I https://pixlite.jose-hernandez.dev
curl -I https://api.pixlite.jose-hernandez.dev
```

Ambos deberían responder `200`. Prueba subir una imagen real desde `https://pixlite.jose-hernandez.dev/professional` (o `/dark`, `/soft`) para confirmar que el front llega al back sin error de CORS.

## Flujo de trabajo día a día

Con esto configurado, el ciclo es:

```
código local → git push origin main → (Coolify redeploya automáticamente si activaste el webhook/auto-deploy, o le das "Redeploy" manualmente)
```

Activa **Automatic Deployment** en la configuración del recurso en Coolify si quieres que cada push a `main` dispare un deploy solo.
