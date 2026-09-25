import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

// Sessão válida sem cadastro ativo de motorista: conta do TMS, conta ainda não
// vinculada pela central ou motorista suspenso. Sem "Sair", a pessoa ficaria
// presa nesta tela com a conta errada.
const UserNotRegisteredError = () => {
  const { logout } = useAuth();
  const [saindo, setSaindo] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-orange-100">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Acesso restrito</h1>
          <p className="text-slate-600 mb-8">
            Esta conta não tem cadastro ativo de motorista no NGS Driver. Fale com a central de operações para liberar o acesso.
          </p>
          <div className="p-4 bg-slate-50 rounded-md text-sm text-slate-600">
            <p>Se você acredita que é um engano:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Confira se entrou com o CPF ou a matrícula certos</li>
              <li>Peça à central para verificar o seu cadastro</li>
              <li>Saia e entre novamente</li>
            </ul>
          </div>
          <button
            onClick={() => { setSaindo(true); logout(true); }}
            disabled={saindo}
            className="mt-6 inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60"
          >
            Sair e entrar com outra conta
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
