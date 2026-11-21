/*
 * SNODO Contracts — escolha do canal (lógica pura, testada em tests/unit/portal.test.js).
 *
 * Canais: "atual" (versão mais nova publicada) e "anterior" (versão imediatamente anterior).
 * Regra (§16 do prompt mestre): a nova versão fica DISPONÍVEL; o usuário só passa a usá-la
 * quando clica em "Atualizar agora". O adiamento só é permitido enquanto houver
 * compatibilidade: mesmo esquema de dados e versão anterior >= versão mínima exigida.
 */
(function (raiz) {
  'use strict';

  function comparar(a, b) {
    var pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
    for (var i = 0; i < 3; i++) {
      if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0) ? 1 : -1;
    }
    return 0;
  }

  function compativel(anterior, atual) {
    return !!anterior && !!atual &&
      Number(anterior.versao_esquema) === Number(atual.versao_esquema) &&
      comparar(anterior.versao, atual.versao_minima_cliente || '0.0.0') >= 0;
  }

  /**
   * @param {{versao,versao_minima_cliente,versao_esquema}|null} atual   info do canal atual (null = indisponível)
   * @param {{...}|null} anterior info do canal anterior (null = inexistente/indisponível)
   * @param {string|null} aceita  versão que este navegador aceitou por último
   * @return {{canal:'atual'|'anterior', aceita:string|null, aviso:null|{disponivel:string, obrigatoria:boolean}, forcada:boolean}}
   */
  function escolherCanal(atual, anterior, aceita) {
    if (!atual) {
      // Canal atual fora do ar: abre o anterior, se houver; senão tenta o atual mesmo assim.
      return anterior ? { canal: 'anterior', aceita: aceita, aviso: null, forcada: false }
                      : { canal: 'atual', aceita: aceita, aviso: null, forcada: false };
    }
    // Primeiro acesso neste navegador: entra na versão mais nova.
    if (!aceita) return { canal: 'atual', aceita: atual.versao, aviso: null, forcada: false };
    // Já aceitou a versão atual (ou mais nova).
    if (comparar(aceita, atual.versao) >= 0) return { canal: 'atual', aceita: atual.versao, aviso: null, forcada: false };
    // Há versão nova não aceita: permanece na anterior enquanto for compatível.
    if (anterior && comparar(anterior.versao, atual.versao) < 0 && compativel(anterior, atual)) {
      return {
        canal: 'anterior',
        aceita: comparar(aceita, anterior.versao) < 0 ? anterior.versao : aceita,
        aviso: { disponivel: atual.versao, obrigatoria: false },
        forcada: comparar(aceita, anterior.versao) < 0
      };
    }
    // Incompatível (ou sem canal anterior): atualização obrigatória.
    return { canal: 'atual', aceita: atual.versao, aviso: null, forcada: true };
  }

  var api = { comparar: comparar, compativel: compativel, escolherCanal: escolherCanal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.SnodoCanal = api;
})(this);
