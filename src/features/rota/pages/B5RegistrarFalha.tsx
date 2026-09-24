import { useEffect, useRef, useState } from 'react';
import ScreenFrame from '../../../lib/ScreenFrame.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../../context/AppContext.jsx';
import PhotoCapture from '../../../components/ui/PhotoCapture.jsx';
import {
  captureCurrentPosition,
  GeolocationCaptureError,
} from '../../../lib/device/geolocation.js';
import { type GeoPoint } from '../../../lib/domain/geofence.js';
import { type CompressedPhoto } from '../../../lib/device/photo.js';
import AppHeader from '../../../components/ui/AppHeader.jsx';
import BottomNav from '../../../components/ui/BottomNav.jsx';

const FAILURE_REASON_LABELS: Record<string, string> = {
  cliente_ausente: 'Cliente Ausente / Fechado',
  endereco_incorreto: 'Endereço Não Localizado / Incorreto',
  recusa_destinatario: 'Recusado pelo Destinatário',
  avaria_produto: 'Avaria ou Dano no Produto',
  area_risco: 'Problema de Acesso / Risco',
  outro_motivo: 'Outro Motivo Operacional',
};

// Foto obrigatória apenas para avaria/dano no produto, seguindo o próprio
// selo "Foto Obrigatória" já presente no design desta tela.
const PHOTO_REQUIRED_REASONS = new Set(['avaria_produto']);

type GeoStatus =
  'capturing' | 'ok' | 'permission-denied' | 'unavailable' | 'timeout' | 'unsupported';

export default function B5RegistrarFalha() {
  const navigate = useNavigate();
  const { stopId = 'stop-05' } = useParams();
  const { registerFailure, showToast } = useApp();
  const reasonContainerRef = useRef<HTMLDivElement | null>(null);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);
  const [selectedReason, setSelectedReason] = useState('cliente_ausente');
  const [photo, setPhoto] = useState<CompressedPhoto | null>(null);
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('capturing');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    document.title = 'RotaPro Driver';
  }, []);

  useEffect(() => {
    let cancelled = false;
    captureCurrentPosition()
      .then((captured) => {
        if (!cancelled) {
          setLocation(captured.point);
          setGeoStatus('ok');
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setGeoStatus(error instanceof GeolocationCaptureError ? error.reason : 'unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const photoRequired = PHOTO_REQUIRED_REASONS.has(selectedReason);

  const handleSubmitFailure = async () => {
    const checked = reasonContainerRef.current?.querySelector<HTMLInputElement>(
      'input[name="failure_reason"]:checked',
    );
    const reasonKey = checked?.value ?? '';
    const reason = FAILURE_REASON_LABELS[reasonKey] || 'Ocorrência operacional';
    const notes = notesRef.current?.value?.trim();
    if (!notes) {
      showToast('Descreva o ocorrido para registrar.', 'warning');
      return;
    }
    if (PHOTO_REQUIRED_REASONS.has(reasonKey) && !photo) {
      showToast('Anexe uma foto da avaria para registrar esta ocorrência.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await registerFailure(stopId, {
        reason,
        notes,
        photo: photo?.dataUrl,
        location: location || undefined,
      });
      navigate('/rota');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <ScreenFrame screenId="b.5_registrar_falha">
      <div>
        <AppHeader title="Rota" />
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin">
          <div className="flex flex-col w-full pb-32">
            {/* Top Navigation & Contextual Stop Header */}
            <div className="flex flex-col w-full bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm mb-space-md">
              <div className="flex items-center justify-between gap-space-sm mb-space-sm">
                <button
                  aria-label="Voltar para a parada"
                  className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95"
                  onClick={() => navigate(-1)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                </button>
                <div className="flex flex-col items-center flex-1 min-w-0 px-space-xs">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                    Parada Operacional
                  </span>
                  <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">
                    Registrar Insucesso
                  </h1>
                </div>
                <div className="w-11 h-11 flex items-center justify-center rounded-full bg-error-container/30 text-error">
                  <span className="material-symbols-outlined text-[22px]">report_problem</span>
                </div>
              </div>
              {/* Stop Details Chips */}
              <div className="flex items-center justify-between bg-surface-container-low rounded-DEFAULT p-space-sm">
                <div className="flex items-center gap-space-xs min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#131313] text-surface-container-lowest font-code-sm text-code-sm flex items-center justify-center font-bold">
                    05
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-md text-label-md text-on-surface truncate">
                      Farmácia Santa Clara
                    </span>
                    <span className="font-code-sm text-code-sm text-secondary truncate">
                      NF-e 89122 • VOL 1/2
                    </span>
                  </div>
                </div>
                <span className="px-space-sm py-1 rounded-full bg-error text-on-error font-label-sm text-label-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-error animate-ping" />
                  Insucesso
                </span>
              </div>
            </div>
            {/* Informative Notice Banner */}
            <div className="flex items-start gap-space-sm bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm mb-space-md">
              <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">info</span>
              </div>
              <div className="flex flex-col flex-1">
                <p className="font-label-md text-label-md text-on-surface">
                  Notificação Imediata à Central
                </p>
                <p className="font-body-sm text-body-sm text-secondary mt-0.5 leading-snug">
                  O romaneio técnico será reordenado, o cliente formalmente notificado e a central
                  de tráfego registrará a ocorrência em tempo real.
                </p>
              </div>
            </div>
            {/* Main Motive Selector Section */}
            <section className="flex flex-col w-full mb-space-md">
              <div className="flex items-center justify-between mb-space-sm px-space-xs">
                <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider">
                  Motivo Principal da Falha
                </span>
                <span className="font-code-sm text-code-sm text-secondary">SELEÇÃO ÚNICA</span>
              </div>
              {/* Reason Cards Grid */}
              <div
                className="flex flex-col gap-space-sm"
                id="reason-container"
                onChange={(event) => setSelectedReason((event.target as HTMLInputElement).value)}
                ref={reasonContainerRef}
              >
                {/* Option 1: Selected by default */}
                <label className="reason-card relative flex items-start gap-space-md p-space-md rounded-DEFAULT bg-surface-container-lowest shadow-sm cursor-pointer transition-all active:scale-[0.99] group bg-surface-container-high/40">
                  <input
                    defaultChecked
                    className="sr-only peer"
                    name="failure_reason"
                    type="radio"
                    defaultValue="cliente_ausente"
                  />
                  <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container peer-checked:bg-primary peer-checked:text-on-primary flex items-center justify-center shrink-0 transition-colors">
                    <span className="material-symbols-outlined text-[22px]">door_front</span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-md text-label-md text-on-surface">
                        Cliente Ausente / Fechado
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-secondary mt-0.5">
                      Sem resposta no interfone, porta trancada ou expediente finalizado
                    </span>
                  </div>
                  <div className="absolute right-4 top-5 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center peer-checked:bg-primary transition-colors">
                    <div className="w-2 h-2 rounded-full bg-on-primary opacity-0 peer-checked:opacity-100" />
                  </div>
                </label>
                {/* Option 2 */}
                <label className="reason-card relative flex items-start gap-space-md p-space-md rounded-DEFAULT bg-surface-container-lowest shadow-sm cursor-pointer transition-all active:scale-[0.99] group">
                  <input
                    className="sr-only peer"
                    name="failure_reason"
                    type="radio"
                    defaultValue="endereco_incorreto"
                  />
                  <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container peer-checked:bg-primary peer-checked:text-on-primary flex items-center justify-center shrink-0 transition-colors">
                    <span className="material-symbols-outlined text-[22px]">wrong_location</span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 pr-6">
                    <span className="font-label-md text-label-md text-on-surface">
                      Endereço Não Localizado / Incorreto
                    </span>
                    <span className="font-body-sm text-body-sm text-secondary mt-0.5">
                      Numeração inexistente, logradouro não confere no GPS
                    </span>
                  </div>
                  <div className="absolute right-4 top-5 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center peer-checked:bg-primary transition-colors">
                    <div className="w-2 h-2 rounded-full bg-on-primary opacity-0 peer-checked:opacity-100" />
                  </div>
                </label>
                {/* Option 3 */}
                <label className="reason-card relative flex items-start gap-space-md p-space-md rounded-DEFAULT bg-surface-container-lowest shadow-sm cursor-pointer transition-all active:scale-[0.99] group">
                  <input
                    className="sr-only peer"
                    name="failure_reason"
                    type="radio"
                    defaultValue="recusa_destinatario"
                  />
                  <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container peer-checked:bg-primary peer-checked:text-on-primary flex items-center justify-center shrink-0 transition-colors">
                    <span className="material-symbols-outlined text-[22px]">do_not_disturb_on</span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 pr-6">
                    <span className="font-label-md text-label-md text-on-surface">
                      Recusado pelo Destinatário
                    </span>
                    <span className="font-body-sm text-body-sm text-secondary mt-0.5">
                      Mercadoria não solicitada, desacordo comercial ou pedido cancelado
                    </span>
                  </div>
                  <div className="absolute right-4 top-5 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center peer-checked:bg-primary transition-colors">
                    <div className="w-2 h-2 rounded-full bg-on-primary opacity-0 peer-checked:opacity-100" />
                  </div>
                </label>
                {/* Option 4: Damaged with mandatory tag */}
                <label className="reason-card relative flex items-start gap-space-md p-space-md rounded-DEFAULT bg-surface-container-lowest shadow-sm cursor-pointer transition-all active:scale-[0.99] group">
                  <input
                    className="sr-only peer"
                    name="failure_reason"
                    type="radio"
                    defaultValue="avaria_produto"
                  />
                  <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container peer-checked:bg-primary peer-checked:text-on-primary flex items-center justify-center shrink-0 transition-colors">
                    <span className="material-symbols-outlined text-[22px]">broken_image</span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-space-xs flex-wrap">
                      <span className="font-label-md text-label-md text-on-surface">
                        Avaria ou Dano no Produto
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-error text-on-error font-code-sm text-[10px] font-bold uppercase">
                        Foto Obrigatória
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-secondary mt-0.5">
                      Embalagem rasgada, vazamento ou integridade violada
                    </span>
                  </div>
                  <div className="absolute right-4 top-5 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center peer-checked:bg-primary transition-colors">
                    <div className="w-2 h-2 rounded-full bg-on-primary opacity-0 peer-checked:opacity-100" />
                  </div>
                </label>
                {/* Option 5 */}
                <label className="reason-card relative flex items-start gap-space-md p-space-md rounded-DEFAULT bg-surface-container-lowest shadow-sm cursor-pointer transition-all active:scale-[0.99] group">
                  <input
                    className="sr-only peer"
                    name="failure_reason"
                    type="radio"
                    defaultValue="area_risco"
                  />
                  <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container peer-checked:bg-primary peer-checked:text-on-primary flex items-center justify-center shrink-0 transition-colors">
                    <span className="material-symbols-outlined text-[22px]">minor_crash</span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 pr-6">
                    <span className="font-label-md text-label-md text-on-surface">
                      Problema de Acesso / Risco
                    </span>
                    <span className="font-body-sm text-body-sm text-secondary mt-0.5">
                      Bloqueio policial, via interditada ou restrição física do veículo
                    </span>
                  </div>
                  <div className="absolute right-4 top-5 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center peer-checked:bg-primary transition-colors">
                    <div className="w-2 h-2 rounded-full bg-on-primary opacity-0 peer-checked:opacity-100" />
                  </div>
                </label>
                {/* Option 6 */}
                <label className="reason-card relative flex items-start gap-space-md p-space-md rounded-DEFAULT bg-surface-container-lowest shadow-sm cursor-pointer transition-all active:scale-[0.99] group">
                  <input
                    className="sr-only peer"
                    name="failure_reason"
                    type="radio"
                    defaultValue="outro_motivo"
                  />
                  <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container peer-checked:bg-primary peer-checked:text-on-primary flex items-center justify-center shrink-0 transition-colors">
                    <span className="material-symbols-outlined text-[22px]">more_horiz</span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 pr-6">
                    <span className="font-label-md text-label-md text-on-surface">
                      Outro Motivo Operacional
                    </span>
                    <span className="font-body-sm text-body-sm text-secondary mt-0.5">
                      Exige detalhamento obrigatório no campo de observações
                    </span>
                  </div>
                  <div className="absolute right-4 top-5 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center peer-checked:bg-primary transition-colors">
                    <div className="w-2 h-2 rounded-full bg-on-primary opacity-0 peer-checked:opacity-100" />
                  </div>
                </label>
              </div>
            </section>
            {/* Photographic Evidence Section */}
            <section className="flex flex-col w-full bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm mb-space-md">
              <div className="flex items-center justify-between mb-space-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    add_a_photo
                  </span>
                  <span className="font-label-md text-label-md text-on-surface">
                    Evidência Fotográfica{photoRequired && <span className="text-error"> *</span>}
                  </span>
                </div>
                <span
                  className={`font-code-sm text-code-sm font-bold ${geoStatus === 'ok' ? 'text-primary' : 'text-secondary'}`}
                >
                  {geoStatus === 'capturing' && 'GPS...'}
                  {geoStatus === 'ok' && 'GPS ATIVO'}
                  {geoStatus !== 'capturing' && geoStatus !== 'ok' && 'GPS INDISPONÍVEL'}
                </span>
              </div>
              {photoRequired && !photo && (
                <p className="font-body-sm text-body-sm text-error mb-space-sm">
                  Foto obrigatória para este motivo de falha.
                </p>
              )}
              {/* Evidence Card */}
              <div className="mb-space-sm">
                {photo ? (
                  <div className="relative flex flex-col rounded-DEFAULT overflow-hidden bg-surface-container shadow-inner aspect-[4/3] group">
                    <img
                      alt="Foto da ocorrência registrada"
                      className="w-full h-full object-cover"
                      src={photo.dataUrl}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#131313]/90 via-transparent to-black/20 flex flex-col justify-between p-2 text-surface-container-lowest">
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 rounded-full bg-primary font-code-sm text-[9px] font-bold">
                          {location ? 'GEO OK' : 'SEM GEO'}
                        </span>
                        <button
                          aria-label="Remover imagem"
                          className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white"
                          onClick={() => setPhoto(null)}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-code-sm text-[10px] text-primary-fixed truncate">
                          {location
                            ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                            : 'Coordenadas indisponíveis'}
                        </span>
                        <span className="font-code-sm text-[9px] text-surface-container-highest">
                          {new Date().toLocaleDateString('pt-BR')} •{' '}
                          {new Date().toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <PhotoCapture
                    hint="Fachada ou avaria"
                    label="Adicionar Foto"
                    onCapture={setPhoto}
                  />
                )}
              </div>
              <div className="flex items-center gap-space-xs text-secondary">
                <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                <span className="font-body-sm text-body-sm text-[11px]">
                  Carimbo temporal e coordenadas capturados junto com a imagem.
                </span>
              </div>
            </section>
            {/* Prior Contact Protocol Log */}
            <section className="flex flex-col w-full bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm mb-space-md">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider">
                  Protocolo de Tentativas
                </span>
                <span className="font-label-sm text-label-sm text-primary flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Validado
                </span>
              </div>
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between p-space-sm rounded-DEFAULT bg-surface-container-low">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-7 h-7 rounded-full bg-[#131313] text-surface-container-lowest flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px]">call</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface">
                        Ligação ao Destinatário
                      </span>
                      <span className="font-body-sm text-body-sm text-[11px] text-secondary">
                        2 tentativas (sem atendimento)
                      </span>
                    </div>
                  </div>
                  <span className="font-code-sm text-code-sm text-secondary">14:26 • 14:29</span>
                </div>
                <div className="flex items-center justify-between p-space-sm rounded-DEFAULT bg-surface-container-low">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface">
                        Mensagem WhatsApp RotaPro
                      </span>
                      <span className="font-body-sm text-body-sm text-[11px] text-secondary">
                        Enviado com geolink
                      </span>
                    </div>
                  </div>
                  <span className="font-code-sm text-code-sm text-secondary">14:27</span>
                </div>
              </div>
            </section>
            {/* Driver Operational Notes */}
            <section className="flex flex-col w-full bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm mb-space-md">
              <div className="flex items-center justify-between mb-space-xs">
                <label
                  className="font-label-md text-label-md text-on-surface"
                  htmlFor="occurrence-notes"
                >
                  Observações da Ocorrência
                </label>
                <span className="font-code-sm text-code-sm text-secondary" id="char-counter">
                  54 / 300
                </span>
              </div>
              <div className="relative w-full">
                <textarea
                  className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md rounded-DEFAULT p-space-md resize-none focus:outline-none focus:bg-surface-container transition-colors"
                  id="occurrence-notes"
                  maxLength={300}
                  placeholder="Descreva os detalhes da tentativa de contato, nome do porteiro ou motivo específico..."
                  ref={notesRef}
                  rows={3}
                  defaultValue={'Porta de aço fechada, vizinho do nº 142 informou almoço.'}
                />
              </div>
            </section>
            {/* Action Controls */}
            <div className="flex flex-col gap-space-sm w-full mt-space-xs">
              {/* Critical Danger Pill Action Button */}
              <button
                className="w-full h-14 rounded-full bg-error text-on-error flex items-center justify-center gap-space-sm font-label-lg text-label-lg shadow-lg active:scale-95 transition-transform disabled:opacity-60"
                disabled={submitting}
                id="btn-submit-failure"
                onClick={handleSubmitFailure}
                type="button"
              >
                <span className="material-symbols-outlined text-[22px]">cancel</span>
                <span>Confirmar Falha da Entrega</span>
              </button>
              {/* Secondary Onyx Dismiss Button */}
              <button
                className="w-full h-12 rounded-full bg-[#131313] text-surface-container-lowest flex items-center justify-center gap-space-xs font-label-md text-label-md hover:bg-black active:scale-95 transition-transform"
                onClick={() => navigate(-1)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">undo</span>
                <span>Cancelar e Retornar à Parada</span>
              </button>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    </ScreenFrame>
  );
}
