# Buscador inteligente de Licitaciones (Next.js + Supabase)

Migración de `app.py` (Streamlit) a Next.js App Router + TypeScript + Tailwind CSS.
Lee tus tablas actuales de Supabase; **no modifica la base de datos**. La ingesta
(`sincronizar_*.py`, `auditar_*.py` y los workflows de GitHub Actions) sigue donde está.

## Acceso con login

Toda la web y `/api/search` exigen sesión (Supabase Auth, correo + contraseña). Sin sesión se redirige a `/login`
y la API responde 401. No hay registro público: los usuarios se crean en Supabase.

## Estructura

```
src/
├── app/
│   ├── api/search/route.ts   # POST /api/search: ejecuta la búsqueda (exige sesión)
│   ├── login/page.tsx        # pantalla de inicio de sesión
│   ├── layout.tsx · page.tsx · globals.css · icon.svg
├── proxy.ts                  # protege rutas y refresca la sesión (en Next 15 se llamaba middleware.ts)
├── components/
│   ├── Buscador.tsx          # formulario, estado y mensajes (cliente)
│   ├── Cabecera.tsx · BotonSalir.tsx · FormularioLogin.tsx · IlustracionResultados.tsx
│   ├── icons.tsx · ui.tsx    # iconos y estilos compartidos
│   ├── MultiSelect.tsx       # desplegable con casillas (st.multiselect)
│   └── ResultsTable.tsx      # tabla con filas verdes/azules y paginación
└── lib/
    ├── constants.ts          # MAPA_TERRITORIAL, SECTORES_CPV, fuentes, tipos (generado de app.py)
    ├── keywords.ts           # sintaxis AND / OR / "frase" / -exclusión
    ├── filters.ts            # aplicar_filtros_comunes
    ├── embeddings.ts         # modelo multilingual-e5-small en el servidor
    ├── search.ts             # RPC buscar_licitaciones / lectura paginada de `licitaciones`
    ├── supabase.ts           # cliente Supabase de DATOS (solo servidor)
    └── supabase/             # clientes de AUTENTICACIÓN (navegador, servidor y proxy)
scripts/
├── test-parity.ts            # compara con los resultados del código Python original
└── fixtures/parity.json
```

## Variables de entorno

| Variable | Dónde | Valor |
|---|---|---|
| `SUPABASE_URL` | `.env.local` y Vercel | Los mismos de tus Secrets de Streamlit |
| `SUPABASE_KEY` | `.env.local` y Vercel | Los mismos de tus Secrets de Streamlit |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` y Vercel | La misma URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` y Vercel | Clave pública (anon o publishable) |
| `ONNXRUNTIME_NODE_INSTALL=skip` | Solo Vercel | Evita descargar binarios CUDA que desbordan el límite de 250 MB de la función |

`SUPABASE_URL` y `SUPABASE_KEY` solo existen en el servidor. Las dos `NEXT_PUBLIC_*` van al navegador y solo sirven para el login; nunca pongas ahí la clave `service_role`.

## En local

```bash
npm install
cp .env.local.example .env.local   # rellena SUPABASE_URL y SUPABASE_KEY
npm run dev                        # http://localhost:3000
npm run test:parity                # comprueba filtros y palabras clave contra Python
```

La primera búsqueda con texto descarga el modelo (~120 MB) y tarda unos segundos.

## Diferencias respecto a Streamlit

- **Máximo 2.000 filas por respuesta** (`MAX_FILAS_RESPUESTA`): las funciones de Vercel limitan el tamaño de respuesta. Si hay más, se avisa y se muestran las primeras; la tabla pagina de 50 en 50.
- **No se descarga `texto_completo`**: la app original lo pedía pero no lo usaba.
- **Importe y fechas de publicación se filtran ya en Supabase** (además de en el servidor) para bajar menos filas.
- **Modelo cuantizado (q8)** en la búsqueda semántica: los porcentajes de relevancia pueden diferir ligeramente de los de `sentence-transformers` en fp32.
- **"Lugar de ejecución (Libre)"** es ahora texto literal; en Pandas se interpretaba como expresión regular.
