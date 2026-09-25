// Provedor de mapas e rotas: Mapbox (o mesmo do TMS — VITE_MAPBOX_PUBLIC_TOKEN,
// token público `pk.*` restrito por URL no painel do Mapbox).
//
// Sem token:
//  * tiles: caem nos provedores anteriores (OSM/Carto) para o mapa nunca ficar
//    em branco — em produção isso é só contingência; configure o token;
//  * rotas: o servidor de DEMONSTRAÇÃO do OSRM só é usado em desenvolvimento
//    (a política dele proíbe uso em produção). Em produção sem token, a rota
//    por vias não é traçada e a navegação segue com o app de navegação externo.
const TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;

export const mapboxAtivo = Boolean(TOKEN);

export function urlTiles(escuro) {
  if (mapboxAtivo) {
    const estilo = escuro ? "dark-v11" : "streets-v12";
    return `https://api.mapbox.com/styles/v1/mapbox/${estilo}/tiles/256/{z}/{x}/{y}@2x?access_token=${TOKEN}`;
  }
  return escuro
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
}

export const atribuicaoMapa = mapboxAtivo
  ? '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  : "&copy; OpenStreetMap &copy; CARTO";

/** Base da API de rotas (formato de resposta compatível com OSRM) ou null se indisponível. */
export function baseRotas() {
  if (mapboxAtivo) return { url: "https://api.mapbox.com/directions/v5/mapbox/driving-traffic/", sufixo: `&access_token=${TOKEN}` };
  if (import.meta.env.DEV) return { url: "https://router.project-osrm.org/route/v1/driving/", sufixo: "" };
  return null;
}
