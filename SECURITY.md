# Seguridad

ARGOS no maneja datos de organizaciones, solo el progreso de quien estudia. Aun así está diseñado como el resto de herramientas del autor: **ningún dato sale del navegador** y **todo lo que entra se trata como hostil**.

## Modelo de amenazas

| Vector | Ejemplo | Defensa |
|---|---|---|
| XSS almacenado | Un JSON de progreso con `<img src=x onerror=…>` como nombre | Todo texto se escapa al pintar (`esc`). Las clases y atributos derivados de datos pasan por listas blancas (colores, temas, ids del banco). |
| Prototype pollution | Claves `__proto__`, `constructor` o `prototype` en el JSON importado o en `localStorage` | Se eliminan al parsear (`safeParse`). Solo se copian claves que existen en el banco (`okKey`). `Object.prototype` y `Array.prototype` se congelan al arrancar. |
| Datos fuera de esquema | XP `9e999`, caja de repaso 99, notas de sala del 700 %, flags inventadas, fechas no válidas | `sanear()` acota cada número, valida fechas y descarta preguntas, salas, máquinas, flags, simulacros y días desconocidos. |
| Logros regalados | Editar el almacenamiento para obtener «Panoptes» sin puntos | Al cargar solo se conservan los logros que el progreso saneado justifica (`logrosCumplidos`). |
| `localStorage` manipulado | Otra página del mismo origen altera el progreso | El progreso se revalida en cada carga y al recibir el evento `storage`. |
| Denegación de servicio | Un JSON de cientos de megas | Límite de 5 MB por fichero y de longitud por campo y por lista (historial de simulacros, días). |
| Ejecución de código inyectado | Un fallo de escapado que deje pasar un script | CSP por hashes generada en la construcción: solo se ejecutan los bloques de `app/build.js`. Sin `'unsafe-inline'` ni `'unsafe-eval'` para código. |
| Exfiltración | Código inyectado que intenta enviar datos fuera | `default-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'`. |
| Acceso al estado desde la página | Una extensión que lee `window` | El estado solo se expone, congelado, en `window.__ARGOS__` cuando la URL lleva `?test` (pruebas automáticas). |

## Verificación automática

`tests/e2e_app.py` comprueba en cada pasada:
- que importar un JSON hostil no contamina prototipos, no ejecuta código y deja los valores acotados;
- que un almacenamiento local manipulado se sanea al recargar;
- que se rechazan un JSON de otra aplicación y un fichero corrupto;
- que la CSP no registra ninguna violación en el uso normal y bloquea un script inyectado;
- que no hay errores de JavaScript ni diálogos inesperados.

## Privacidad

No hay servidor, cuentas, cookies ni analítica. El progreso (nombre, puntos, respuestas) se guarda solo en el almacenamiento local del navegador, sin cifrar, y cualquier página del mismo origen podría leerlo. No escribas datos sensibles en el campo de nombre.

## Informar de una vulnerabilidad

Escribe a **yoandyramirezdelgado@gmail.com** con el asunto `ARGOS · seguridad`, una descripción y, si puedes, una prueba de concepto. No abras una incidencia pública hasta que esté corregida. Respuesta en un máximo de 7 días.
