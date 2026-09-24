import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export const routeFromPath = (path) => ({ rota: '/rota', historico: '/historico', recibos: '/recibos', perfil: '/perfil' }[path] || '/rota');

export default function PageRuntime({ screenId, children }) {
  const ref = useRef(null);
  const navigate = useNavigate();
  const params = useParams();
  const { login, updateChecklist, startNavigation, confirmDelivery, registerFailure, finishRoute, showToast, logout, route } = useApp();
  const stop = route.stops.find((item) => item.id === params.stopId) || route.stops[0];

  const handleClick = useCallback(async (event) => {
    const target = event.target.closest('a,button');
    if (!target || !ref.current?.contains(target)) return;
    const text = target.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
    const id = target.id || '';
    const path = target.getAttribute('data-path');
    const href = target.getAttribute('href');
    if (path) { event.preventDefault(); navigate(routeFromPath(path)); return; }
    if (href === '#') event.preventDefault();
    if (target.getAttribute('aria-label')?.toLowerCase().includes('voltar')) { event.preventDefault(); navigate(-1); return; }
    if (screenId === 'a.1_login_do_motorista' && (text.includes('esqueci minha senha') || text.includes('acessar recuperação'))) { event.preventDefault(); navigate('/recuperar'); return; }
    if (screenId === 'a.1_login_do_motorista' && (id === 'btn-submit' || text.includes('entrar no sistema'))) { event.preventDefault(); const fields = ref.current.querySelectorAll('input'); const result = await login({ identifier: fields[0]?.value, password: fields[1]?.value }); if (result.ok) navigate('/checklist'); else showToast(result.message, 'warning'); return; }
    if (screenId === 'a.3_checklist_do_ve_culo' && (text.includes('concluir checklist') || id === 'btn-iniciar-turno' || text.includes('iniciar turno'))) { event.preventDefault(); const checked = Object.fromEntries([...ref.current.querySelectorAll('input[type="checkbox"]')].map((input, index) => [input.name || `item-${index}`, input.checked])); updateChecklist('vehicle', checked); navigate('/rota'); return; }
    if (screenId === 'b.1_rota_do_dia_home') { if (text.includes('navegar') || text.includes('iniciar próxima')) { startNavigation(stop.id); navigate(`/rota/parada/${stop.id}/navegar`); return; } if (text.includes('ver detalhes')) { navigate(`/rota/parada/${stop.id}`); return; } }
    if (screenId === 'b.2_detalhe_da_parada') { if (text.includes('navegar até')) { startNavigation(params.stopId || stop.id); navigate(`/rota/parada/${params.stopId || stop.id}/navegar`); return; } if (text.includes('registrar ocorrência')) { navigate(`/rota/parada/${params.stopId || stop.id}/falha`); return; } }
    if (screenId === 'b.3_navega_o_at_a_parada') { if (text.includes('cheguei')) { navigate(`/rota/parada/${params.stopId || stop.id}/entrega`); return; } if (text.includes('não consegui')) { navigate(`/rota/parada/${params.stopId || stop.id}/falha`); return; } }
    if (screenId === 'b.4_confirmar_entrega' && (id.includes('submit') || text.includes('concluir e transmitir'))) { event.preventDefault(); const inputs = ref.current.querySelectorAll('input'); const recipient = [...inputs].find((input) => /recebedor|nome completo/i.test(input.placeholder || input.name || ''))?.value || inputs[0]?.value; const signature = [...inputs].find((input) => /assinatura/i.test(input.placeholder || input.name || ''))?.value || recipient; if (!recipient || !signature) { showToast('Informe o recebedor e a assinatura.', 'warning'); return; } confirmDelivery(params.stopId || stop.id, { recipient, signature }); navigate('/rota'); return; }
    if (screenId === 'b.4_confirmar_entrega' && text.includes('registrar ocorrência')) { navigate(`/rota/parada/${params.stopId || stop.id}/falha`); return; }
    if (screenId === 'b.5_registrar_falha' && (id.includes('submit') || text.includes('registrar ocorrência'))) { event.preventDefault(); const select = ref.current.querySelector('select'); const notes = ref.current.querySelector('textarea')?.value?.trim(); const reason = select?.value || 'Ocorrência operacional'; if (!notes) { showToast('Descreva o ocorrido para registrar.', 'warning'); return; } registerFailure(params.stopId || stop.id, { reason, notes }); navigate('/rota'); return; }
    if (screenId === 'b.6_fim_de_rota' && text.includes('checklist de retorno')) { navigate('/rota/retorno'); return; }
    if (screenId === 'b.7_checklist_de_retorno' && (id.includes('submit') || text.includes('concluir checklist'))) { event.preventDefault(); const checked = Object.fromEntries([...ref.current.querySelectorAll('input[type="checkbox"]')].map((input, index) => [input.name || `item-${index}`, input.checked])); if (Object.values(checked).every(Boolean)) { updateChecklist('return', checked); finishRoute(); navigate('/rota'); } else showToast('Conclua todos os itens do retorno.', 'warning'); return; }
    if (screenId === 'c.1_hist_rico_de_rotas' && (text.includes('detalhes') || text.includes('ver rota'))) { navigate('/historico/ROM-2024-88376'); return; }
    if (screenId === 'd.1_recibos' && (text.includes('nf-') || text.includes('detalhe'))) { navigate('/recibos/receipt-88401'); return; }
    if (screenId === 'e.1_perfil_do_motorista' && text.includes('suporte')) { navigate('/suporte'); return; }
    if (screenId === 'e.1_perfil_do_motorista' && id === 'btn-logoff') { logout(); navigate('/'); return; }
  }, [screenId, navigate, params.stopId, stop.id, login, updateChecklist, startNavigation, confirmDelivery, registerFailure, finishRoute, showToast, logout]);

  useEffect(() => { document.title = 'RotaPro Driver'; }, []);
  return <div ref={ref} data-screen-runtime={screenId} onClick={handleClick}>{children}</div>;
}
