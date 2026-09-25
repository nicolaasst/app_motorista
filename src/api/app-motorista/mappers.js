// Linha do banco (colunas em português, padrão do TMS) → objeto que as telas já
// usam (nomes herdados do Base44). Valores de enum são idênticos nos dois lados;
// aqui só se renomeiam campos. Ver docs/MIGRACAO_ENTIDADES_BASE44.md §5.

const num = (v) => (v === null || v === undefined ? v : Number(v));

export function rota(r) {
  if (!r) return null;
  return {
    id: r.id,
    code: r.codigo,
    driver_id: r.motorista_id,
    vehicle_id: r.tms_veiculo_id,
    date: r.data,
    shift: r.turno,
    sector: r.setor,
    neighborhoods: r.bairros || [],
    planned_stops: r.paradas_previstas,
    planned_km: num(r.km_previsto),
    eta_end: r.previsao_fim,
    status: r.status,
    started_at: r.iniciada_em,
    finished_at: r.finalizada_em,
    odometer_start: num(r.odometro_inicial),
    odometer_end: num(r.odometro_final),
    odometer_start_photo: r.foto_odometro_inicial_id,
    odometer_end_photo: r.foto_odometro_final_id,
    origin: r.origem,
    polyline: r.polyline,
    created_date: r.created_at,
    updated_date: r.updated_at,
  };
}

export function parada(p) {
  if (!p) return null;
  return {
    id: p.id,
    route_id: p.rota_id,
    sequence: p.sequencia,
    kind: p.tipo,
    recipient_name: p.destinatario_nome,
    doc_cnpj: p.destinatario_documento,
    address_line: p.endereco,
    district: p.bairro,
    city: p.cidade,
    state: p.uf,
    cep: p.cep,
    lat: num(p.lat),
    lng: num(p.lng),
    window_start: p.janela_inicio,
    window_end: p.janela_fim,
    contact_name: p.contato_nome,
    contact_role: p.contato_funcao,
    contact_phone: p.contato_telefone,
    access_instructions: p.instrucoes_acesso,
    status: p.status,
    arrived_at: p.chegada_em,
    finished_at: p.finalizada_em,
    eta: p.eta,
    created_date: p.created_at,
  };
}

export function volume(v) {
  if (!v) return null;
  return {
    id: v.id,
    stop_id: v.parada_id,
    route_id: v.rota_id,
    nf_number: v.nf_numero,
    nfe_key: v.nfe_chave,
    label: v.rotulo,
    ean: v.ean,
    vol_code: v.codigo_volume,
    weight_kg: num(v.peso_kg),
    kind: v.tipo,
    scan_status: v.status_leitura,
    scanned_at: v.lido_em,
    scanned_by: v.lido_por,
    return_status: v.status_devolucao,
    returned_at: v.devolvido_em,
    return_dock: v.doca_devolucao,
    created_date: v.created_at,
  };
}

export function comprovante(c) {
  if (!c) return null;
  return {
    id: c.id,
    stop_id: c.parada_id,
    route_id: c.rota_id,
    receiver_name: c.recebedor_nome,
    receiver_doc: c.recebedor_documento,
    receiver_is_holder: c.recebedor_titular,
    receiver_type: c.recebedor_tipo,
    receiver_type_other: c.recebedor_tipo_outro,
    signature_document_id: c.assinatura_documento_id,
    signature_hash: c.assinatura_sha256,
    notes: c.observacoes,
    lat: num(c.lat),
    lng: num(c.lng),
    accuracy_m: num(c.precisao_m),
    distance_m: num(c.distancia_parada_m),
    within_geofence: c.dentro_geofence,
    delivered_at: c.entregue_em,
    photos: [],
    sync_status: "ok",
    created_date: c.created_at,
  };
}

export function insucesso(f) {
  if (!f) return null;
  return {
    id: f.id,
    stop_id: f.parada_id,
    route_id: f.rota_id,
    reason: f.motivo,
    notes: f.observacoes,
    contact_attempts: f.tentativas_contato || [],
    lat: num(f.lat),
    lng: num(f.lng),
    accuracy_m: num(f.precisao_m),
    within_geofence: f.dentro_geofence,
    reported_at: f.registrado_em,
    photos: [],
    sync_status: "ok",
    created_date: f.created_at,
  };
}

export function perfil(p) {
  if (!p) return null;
  return {
    id: p.user_id,
    user_id: p.user_id,
    full_name: p.nome_completo,
    matricula: p.matricula,
    cpf: p.cpf,
    cnh_number: p.cnh_numero,
    cnh_category: p.cnh_categoria,
    cnh_expires_at: p.cnh_validade,
    phone: p.telefone,
    email_corporate: p.email_corporativo,
    email_personal: p.email_pessoal,
    avatar_url: p.avatar_documento_id || "",
    fleet: p.frota,
    level: p.nivel,
    sla_pct: num(p.sla_pct),
    registration_status: p.situacao_cadastro,
    address: p.endereco || {},
    emergency_contact: p.contato_emergencia || {},
  };
}

export function preferencias(x) {
  if (!x) return null;
  return {
    id: x.user_id,
    driver_id: x.user_id,
    default_nav_app: x.app_navegacao,
    sound_alerts: x.alertas_sonoros,
    scan_beep: x.bipe_leitura,
    theme: x.tema,
    orientation_pref: x.orientacao,
    offline_map_area: x.area_mapa_offline,
    offline_map_mb: num(x.mapa_offline_mb),
    remember_login: x.lembrar_login,
  };
}

/** Preferências da tela → chaves aceitas por app_motorista_atualizar_preferencias. */
export function preferenciasParaBanco(patch) {
  const mapa = {
    default_nav_app: "app_navegacao",
    sound_alerts: "alertas_sonoros",
    scan_beep: "bipe_leitura",
    theme: "tema",
    orientation_pref: "orientacao",
    offline_map_area: "area_mapa_offline",
    offline_map_mb: "mapa_offline_mb",
    remember_login: "lembrar_login",
  };
  const saida = {};
  for (const [k, v] of Object.entries(patch || {})) if (mapa[k]) saida[mapa[k]] = v;
  return saida;
}

const STATUS_VEICULO = { em_rota: "operacional", disponivel: "operacional", manutencao: "manutencao" };

export function veiculo(v) {
  if (!v) return null;
  return {
    id: v.id,
    plate: v.placa,
    brand_model: v.modelo,
    body_type: v.tipo_label,
    fleet: v.codigo_interno,
    last_odometer_km: num(v.hodometro_km),
    crlv_year: v.ano_label,
    capacity: v.capacidade_label,
    status: STATUS_VEICULO[v.status_operacional] || "indisponivel",
  };
}

export function documentoPessoal(d) {
  return {
    id: d.id,
    kind: d.tipo,
    title: d.titulo,
    subtitle: d.subtitulo,
    valid_until: d.valido_ate,
    status: d.status,
    file_url: d.documento_id || "",
    uploaded_at: d.enviado_em,
  };
}

export function contaBancaria(c) {
  return {
    id: c.id,
    bank_code: c.banco_codigo,
    bank_name: c.banco_nome,
    agency: c.agencia,
    account: c.conta,
    account_type: c.tipo_conta,
    pix_key_type: c.pix_tipo,
    pix_key: c.pix_chave,
    is_primary: c.principal,
    changed_at: c.alterada_em,
    pending_change: c.situacao === "pendente_aprovacao",
  };
}

export function recibo(r) {
  if (!r) return null;
  return {
    id: r.id,
    code: r.codigo,
    driver_id: r.motorista_id,
    period_start: r.periodo_inicio,
    period_end: r.periodo_fim,
    fortnight: r.quinzena,
    gross: num(r.bruto),
    discounts_total: num(r.descontos_total),
    net: num(r.liquido),
    status: r.status,
    sign_deadline: r.prazo_assinatura,
    deposit_date: r.data_deposito,
    paid_at: r.pago_em,
    paid_via: r.pago_via,
    bank_snapshot: r.conta_snapshot,
    signed_at: r.assinado_em,
    signature_hash: r.assinatura_sha256,
    sign_lat: num(r.assinatura_lat),
    sign_lng: num(r.assinatura_lng),
    pdf_url: r.pdf_documento_id || "",
    created_date: r.created_at,
  };
}

export function reciboItem(i) {
  return {
    id: i.id,
    receipt_id: i.recibo_id,
    group: i.grupo,
    label: i.rotulo,
    detail: i.detalhe,
    qty: num(i.quantidade),
    unit_value: num(i.valor_unitario),
    value: num(i.valor),
    created_date: i.created_at,
  };
}

export function reciboRota(l) {
  return {
    receipt_id: l.recibo_id,
    route_id: l.rota_id,
    date: l.data,
    stops_done: l.paradas_concluidas,
    sla_pct: num(l.sla_pct),
  };
}

export function notificacao(n) {
  return {
    id: n.id,
    driver_id: n.motorista_id,
    type: n.tipo,
    title: n.titulo,
    body: n.corpo,
    deep_link: n.deep_link,
    read: !!n.lida_em,
    created_date: n.created_at,
  };
}

export function faq(f) {
  return { id: f.id, category: f.categoria, question: f.pergunta, answer: f.resposta, order: f.ordem };
}

export function chamado(c) {
  return {
    id: c.codigo,
    code: c.codigo,
    category: c.categoria,
    subject: c.assunto,
    description: c.descricao,
    status: c.status,
    central_reply: c.resposta_central || "",
    route_id: c.rota_id,
    receipt_id: c.recibo_id,
    opened_at: c.aberto_em,
    closed_at: c.encerrado_em,
  };
}
