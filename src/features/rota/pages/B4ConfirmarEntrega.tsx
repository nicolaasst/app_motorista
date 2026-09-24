import { useEffect, useRef, useState } from 'react';
import ScreenFrame from '../../../lib/ScreenFrame.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../../context/AppContext.jsx';
import SignaturePad, { type SignaturePadHandle } from '../../../components/ui/SignaturePad.jsx';
import PhotoCapture from '../../../components/ui/PhotoCapture.jsx';
import {
  captureCurrentPosition,
  GeolocationCaptureError,
} from '../../../lib/device/geolocation.js';
import { evaluateGeofence, type GeoPoint } from '../../../lib/domain/geofence.js';
import { type CompressedPhoto } from '../../../lib/device/photo.js';
import AppHeader from '../../../components/ui/AppHeader.jsx';
import BottomNav from '../../../components/ui/BottomNav.jsx';

type GeoStatus =
  'capturing' | 'ok' | 'permission-denied' | 'unavailable' | 'timeout' | 'unsupported';

export default function B4ConfirmarEntrega() {
  const navigate = useNavigate();
  const { stopId = 'stop-05' } = useParams();
  const { route, confirmDelivery, showToast } = useApp();
  const expectedLocation = route.stops.find((stop) => stop.id === stopId)?.location;
  const recipientRef = useRef<HTMLInputElement | null>(null);
  const signaturePadRef = useRef<SignaturePadHandle | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [photo, setPhoto] = useState<CompressedPhoto | null>(null);
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('capturing');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'RotaPro Driver';
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

  const geofence =
    location && expectedLocation ? evaluateGeofence(location, expectedLocation) : null;

  const handleConfirm = async () => {
    const recipient = recipientRef.current?.value?.trim();
    if (!recipient) {
      showToast('Informe o nome de quem recebeu.', 'warning');
      return;
    }
    if (!signature) {
      showToast('Colete a assinatura de quem recebeu.', 'warning');
      return;
    }
    if (geofence && !geofence.withinRange) {
      showToast(
        `Você está a ${Math.round(geofence.distanceMeters)}m do endereço esperado. Confirmando mesmo assim.`,
        'warning',
      );
    }
    setSubmitting(true);
    try {
      await confirmDelivery(stopId, {
        recipient,
        signature,
        photo: photo?.dataUrl,
        location: location || undefined,
      });
      navigate('/rota');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <ScreenFrame screenId="b.4_confirmar_entrega">
      <div>
        <AppHeader title="Rota" />
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin">
          <div className="flex flex-col w-full pb-8">
            {/* Sub-Header da Parada */}
            <div className="flex items-center justify-between mb-4 pt-1">
              <div className="flex items-center gap-3">
                <button
                  aria-label="Voltar para detalhe da parada"
                  className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-on-surface active:scale-95 transition-transform shadow-sm"
                  onClick={() => navigate(-1)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                </button>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-headline-md text-headline-md text-on-surface">
                      Confirmar Entrega
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-secondary">
                    Parada #05 • Farmácia Santa Clara Ltda
                  </span>
                </div>
              </div>
              <div className="bg-inverse-surface text-surface-container-lowest px-3 py-1.5 rounded-full shadow-sm">
                <span className="font-code-md text-code-md tracking-wider">NF-e 89122</span>
              </div>
            </div>
            {/* Stepper de Fluxo Ágil (Pill Tabs) */}
            <div className="grid grid-cols-2 gap-2 bg-surface-container p-1 rounded-full mb-5 shadow-sm">
              <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-surface-container-lowest shadow-sm">
                <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary font-code-sm text-code-sm flex items-center justify-center">
                  1
                </span>
                <span className="font-label-sm text-label-sm text-on-surface">
                  Assinatura Digital
                </span>
                {signature ? (
                  <span className="material-symbols-outlined text-primary text-[16px]">
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
                    radio_button_unchecked
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-surface-container-lowest shadow-sm">
                <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary font-code-sm text-code-sm flex items-center justify-center">
                  2
                </span>
                <span className="font-label-sm text-label-sm text-on-surface">
                  Foto Comprovante
                </span>
                {photo ? (
                  <span className="material-symbols-outlined text-primary text-[16px]">
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
                    radio_button_unchecked
                  </span>
                )}
              </div>
            </div>
            {/* Bloco 1: Identificação do Recebedor */}
            <div className="bg-surface-container-lowest rounded-[20px] p-5 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                  </div>
                  <h2 className="font-label-lg text-label-lg text-on-surface">
                    Identificação do Recebedor
                  </h2>
                </div>
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wide bg-surface-container-low px-2.5 py-1 rounded-full">
                  Obrigatório
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <label
                    className="block font-label-sm text-label-sm text-secondary mb-1.5"
                    htmlFor="recipient-name"
                  >
                    Nome Completo de Quem Recebeu
                  </label>
                  <div className="flex items-center bg-surface-container-low rounded-full px-4 h-13 shadow-inner">
                    <span className="material-symbols-outlined text-secondary mr-2.5 text-[20px]">
                      person
                    </span>
                    <input
                      className="w-full bg-transparent font-body-lg text-body-lg text-on-surface focus:outline-none"
                      id="recipient-name"
                      placeholder="Nome do recebedor"
                      ref={recipientRef}
                      type="text"
                      defaultValue="Roberto Silveira"
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="block font-label-sm text-label-sm text-secondary mb-1.5"
                    htmlFor="recipient-document"
                  >
                    RG ou CPF do Recebedor
                  </label>
                  <div className="flex items-center bg-surface-container-low rounded-full px-4 h-13 shadow-inner">
                    <span className="material-symbols-outlined text-secondary mr-2.5 text-[20px]">
                      fingerprint
                    </span>
                    <input
                      className="w-full bg-transparent font-code-md text-code-md text-on-surface focus:outline-none tracking-wide"
                      id="recipient-document"
                      placeholder="00.000.000-0"
                      type="text"
                      defaultValue="28.914.302-8"
                    />
                  </div>
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-3 select-none">
                    <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </div>
                    <span className="font-body-md text-body-md text-on-surface">
                      Recebedor é o titular ou responsável legal
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Bloco 2: Canvas de Assinatura Digital na Tela */}
            <div className="bg-surface-container-lowest rounded-[20px] p-5 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">draw</span>
                  </div>
                  <h2 className="font-label-lg text-label-lg text-on-surface">
                    Assinatura no Vidro
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Biometria Ativa
                  </span>
                </div>
              </div>
              {/* Área de Captura Real de Assinatura (Pointer Events sobre canvas) */}
              <div className="relative w-full h-44 bg-surface-container-low rounded-[20px] p-4 flex flex-col justify-between overflow-hidden shadow-inner">
                <SignaturePad
                  className="absolute inset-0"
                  height={176}
                  onChange={setSignature}
                  ref={signaturePadRef}
                  showOwnClearButton={false}
                />
                {/* Top Tools Bar */}
                <div className="flex items-center justify-between z-10">
                  <span className="font-code-sm text-code-sm text-secondary tracking-tight">
                    {geoStatus === 'capturing' && 'Obtendo localização…'}
                    {geoStatus === 'ok' &&
                      location &&
                      `LAT: ${location.lat.toFixed(4)} | LNG: ${location.lng.toFixed(4)}`}
                    {geoStatus !== 'capturing' && geoStatus !== 'ok' && 'Localização indisponível'}
                  </span>
                  <button
                    className="flex items-center gap-1 bg-surface-container-lowest px-3 py-1.5 rounded-full shadow-sm text-error hover:bg-error-container active:scale-95 transition-all"
                    onClick={() => signaturePadRef.current?.clear()}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">ink_eraser</span>
                    <span className="font-label-sm text-label-sm">Limpar</span>
                  </button>
                </div>
                {/* Base Guide Line */}
                {!signature && (
                  <div className="z-10 flex flex-col items-center pointer-events-none">
                    <div className="w-full h-[1.5px] bg-secondary/30 mb-2" />
                    <div className="flex items-center gap-1.5 text-secondary">
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      <span className="font-label-sm text-label-sm">
                        Assine com o dedo ou caneta stylus sobre a linha
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Bloco 3: Evidência Fotográfica do Pacote / Canhoto */}
            <div className="bg-surface-container-lowest rounded-[20px] p-5 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  </div>
                  <h2 className="font-label-lg text-label-lg text-on-surface">
                    Comprovante Fotográfico
                  </h2>
                </div>
                <span className="font-code-md text-code-md text-primary bg-surface-container px-2.5 py-0.5 rounded-full">
                  1/1
                </span>
              </div>
              {photo ? (
                <div className="relative w-full h-52 rounded-[20px] overflow-hidden shadow-sm mb-3">
                  <img
                    alt="Foto comprovante da entrega"
                    className="w-full h-full object-cover"
                    src={photo.dataUrl}
                  />
                  <div className="absolute top-3 left-3 bg-inverse-surface/85 backdrop-blur-md px-3 py-1 rounded-full text-surface flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-tertiary-fixed" />
                    <span className="font-label-sm text-label-sm">Foto 1 de 1 anexada</span>
                  </div>
                  <div className="absolute bottom-3 inset-x-3 bg-inverse-surface/80 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between text-surface">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary-fixed text-[18px]">
                        verified
                      </span>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-surface leading-tight">
                          Canhoto anexado
                        </span>
                        <span className="font-code-sm text-code-sm text-secondary-fixed-dim">
                          {geofence?.withinRange
                            ? 'Geo-validado'
                            : geoStatus === 'ok'
                              ? 'Fora do raio esperado'
                              : 'Sem geo-validação'}
                        </span>
                      </div>
                    </div>
                    <button
                      className="bg-surface-container-lowest text-on-surface px-3 py-1 rounded-full font-label-sm text-label-sm shadow-sm active:scale-95 transition-transform flex items-center gap-1"
                      onClick={() => setPhoto(null)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[14px]">refresh</span>
                      Refazer
                    </button>
                  </div>
                </div>
              ) : (
                <PhotoCapture
                  hint="Opcional"
                  label="Adicionar Foto do Comprovante"
                  onCapture={setPhoto}
                />
              )}
            </div>
            {/* Bloco 4: Campo Opcional de Observações */}
            <div className="bg-surface-container-lowest rounded-[20px] p-5 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-2">
                <label
                  className="font-label-md text-label-md text-on-surface flex items-center gap-2"
                  htmlFor="observacoes-entrega"
                >
                  <span className="material-symbols-outlined text-secondary text-[18px]">
                    notes
                  </span>
                  Observações da Entrega
                </label>
                <span className="font-body-sm text-body-sm text-secondary">Opcional</span>
              </div>
              <div className="bg-surface-container-low rounded-[16px] p-3 shadow-inner">
                <textarea
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none resize-none"
                  id="observacoes-entrega"
                  placeholder="Ex: Entregue na recepção central, conferido com o responsável..."
                  rows={2}
                  defaultValue={
                    'Entregue na recepção central, conferido e testado na presença do responsável.'
                  }
                />
              </div>
            </div>
            {/* Bloco Operacional de Confirmação e Transmissão */}
            <div className="flex flex-col gap-3">
              <button
                className="w-full h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center gap-3 font-label-lg text-label-lg shadow-lg shadow-primary/25 active:bg-primary active:scale-[0.99] transition-all disabled:opacity-60"
                disabled={submitting}
                id="btn-confirm-submit"
                onClick={handleConfirm}
                type="button"
              >
                <span className="material-symbols-outlined text-[24px]">task_alt</span>
                <span>Concluir e Transmitir Entrega</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
              <div className="flex items-center justify-center gap-2 text-secondary">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-container" />
                </span>
                <span className="font-label-sm text-label-sm">
                  Sincronização imediata em nuvem ativa
                </span>
              </div>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    </ScreenFrame>
  );
}
