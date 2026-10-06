// GET /lista — lleva a la lista de precios (Google Sheets) solo si hay sesión iniciada.
import { currentUser } from './_lib.js';
const LISTA = 'https://docs.google.com/spreadsheets/d/16pnoHtlqJZe-z3TKIid5_30AWFDBLbU5cs_kswoKt90/edit';
export async function onRequestGet({ request, env }) {
  const go = (to) => new Response(null, { status: 302, headers: { location: to, 'cache-control': 'no-store' } });
  // Sin base de datos conectada (modo anterior) se comporta como siempre.
  if (env.DB && !(await currentUser(request, env))) return go(new URL('/?aviso=login', request.url).href);
  return go(env.LISTA_URL || LISTA);
}
