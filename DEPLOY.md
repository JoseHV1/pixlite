# Desplegar Pixlite

Este proyecto se despliega como un recurso **Docker Compose** en Coolify (usa `docker-compose.yml` en la raíz, que define los servicios `back` y `front`). Coolify se encarga de clonar el repo, construir las imágenes y levantar los contenedores en cada deploy — **pero no de servir el tráfico público ni el SSL**: en este VPS, Apache es quien ocupa los puertos 80/443 y sirve todos los dominios (incluido el propio panel de Coolify), así que Apache es la puerta de entrada real, igual que para `n8n.jose-hernandez.dev` y el resto de proyectos.

## Arquitectura

```
internet → Apache (80/443, SSL real via certbot) → 127.0.0.1:3002 (back) / 127.0.0.1:3003 (front)
                                                              ↑
                                              contenedores Docker gestionados por Coolify
```

`back` y `front` publican puertos fijos del host (`3002` y `3003`, ver `docker-compose.yml`) precisamente para que Apache tenga un target estable al que apuntar, sin depender del proxy interno de Coolify (Traefik) para el ruteo público.

## 1. DNS

Registros `A` apuntando a la IP del VPS (`147.93.3.184`), **sin proxy de Cloudflare** (nube gris/DNS-only) — igual que `n8n.jose-hernandez.dev`:

| Host | Tipo | Valor | Proxy |
|---|---|---|---|
| `pixlite.jose-hernandez.dev` | A | `147.93.3.184` | DNS only |
| `api.pixlite.jose-hernandez.dev` | A | `147.93.3.184` | DNS only |

## 2. Acceso de Coolify al repo privado

El repo `github.com/JoseHV1/pixlite` es privado. Coolify usa una deploy key SSH dedicada (creada como recurso "Private Key" en Coolify, no la del host) y esa misma clave pública está agregada en GitHub → Settings → Deploy keys (solo lectura).

## 3. Recurso en Coolify

- **New Resource → Docker Compose**, repo `JoseHV1/pixlite`, branch `main`, **Docker Compose Location**: `docker-compose.yml`.
- Coolify detecta los servicios `back` y `front` y los reconstruye en cada deploy.
- Variable de entorno `CORS_ORIGIN` ya viene con su valor por defecto en el propio `docker-compose.yml` (`https://pixlite.jose-hernandez.dev`).
- Los dominios que Coolify asigna internamente (`docker_compose_domains`) quedan configurados pero **no son los que sirven el tráfico real** — son vestigiales dado que Apache es la puerta de entrada. No hace falta tocarlos.

## 4. Apache (puerta de entrada real + SSL)

Vhosts en `/etc/apache2/sites-available/`, proxy directo a los puertos fijos del compose:

```apache
# pixlite.conf
<VirtualHost *:80>
    ServerName pixlite.jose-hernandez.dev
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3003/
    ProxyPassReverse / http://127.0.0.1:3003/
    ErrorLog ${APACHE_LOG_DIR}/pixlite_error.log
    CustomLog ${APACHE_LOG_DIR}/pixlite_access.log combined
</VirtualHost>
```

```apache
# pixlite-api.conf
<VirtualHost *:80>
    ServerName api.pixlite.jose-hernandez.dev
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3002/
    ProxyPassReverse / http://127.0.0.1:3002/
    ErrorLog ${APACHE_LOG_DIR}/pixlite-api_error.log
    CustomLog ${APACHE_LOG_DIR}/pixlite-api_access.log combined
</VirtualHost>
```

```bash
sudo a2ensite pixlite.conf pixlite-api.conf
sudo systemctl reload apache2
sudo certbot --apache -d pixlite.jose-hernandez.dev -d api.pixlite.jose-hernandez.dev
```

Certbot reescribe estos vhosts para añadir el bloque `:443` con el certificado real, igual que hizo para `n8n.jose-hernandez.dev`.

## 5. Verificar

```bash
curl -I https://pixlite.jose-hernandez.dev
curl -I https://api.pixlite.jose-hernandez.dev
```

Ambos deberían responder `200` con certificado válido. Prueba subir una imagen real desde `https://pixlite.jose-hernandez.dev` para confirmar que el front llega al back sin error de CORS.

## Flujo de trabajo día a día

```
código local → git push origin main → Coolify reconstruye y redespliega los contenedores automáticamente
```

El auto-deploy ya está configurado: hay un webhook activo en `github.com/JoseHV1/pixlite` (Settings → Webhooks) que apunta a `https://coolify.jose-hernandez.dev/webhooks/source/github/events`. Cada push a `main` dispara el deploy solo, sin intervención manual. Apache y el certificado SSL no necesitan tocarse de nuevo salvo que cambien los dominios.
