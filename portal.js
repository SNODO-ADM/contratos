/*
 * SNODO Contracts — página de entrada (endereço próprio).
 * 1. Consulta a versão de cada canal (?info=canal, dados públicos e mínimos).
 * 2. Abre no iframe o canal que este navegador aceitou (SnodoCanal.escolherCanal).
 * 3. Responde à interface se há versão nova; só troca de canal quando o usuário clica
 *    em "Atualizar agora" (mensagem snodo:aceitar).
 * Nenhum dado de negócio, token ou credencial passa por esta página.
 */
(function () {
  'use strict';
  var CHAVE_PADRAO = 'snodo_versao_aceita';
  function chave() { return (cfg && cfg.chave) || CHAVE_PADRAO; }
  var ORIGEM_APP = /^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/;
  var cfg = null, info = { atual: null, anterior: null }, escolha = null, respondeu = false, vigia = null;
  var iframe = document.getElementById('app');
  var splash = document.getElementById('splash');

  function ler() { try { return localStorage.getItem(chave()); } catch (e) { return null; } }
  function gravar(v) { try { if (v) localStorage.setItem(chave(), v); } catch (e) { /* sem armazenamento: só não lembra */ } }
  function msg(t) { document.getElementById('splash-msg').textContent = t; }
  function aviso(t) {
    var a = document.getElementById('aviso');
    a.textContent = t; a.hidden = false;
    setTimeout(function () { a.hidden = true; }, 8000);
  }

  function buscarInfo(id) {
    if (!id) return Promise.resolve(null);
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
    return fetch(cfg.base_info + id + '/exec?info=canal', { credentials: 'omit', cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j && j.app === 'snodo-contracts' && j.versao ? j : null; })
      .catch(function () { return null; })
      .then(function (j) { clearTimeout(t); return j; });
  }

  function abrir() {
    msg('Verificando a versão…');
    return Promise.all([buscarInfo(cfg.canais.atual), buscarInfo(cfg.canais.anterior)]).then(function (r) {
      info.atual = r[0]; info.anterior = r[1];
      escolha = window.SnodoCanal.escolherCanal(info.atual, info.anterior, ler());
      gravar(escolha.aceita);
      if (escolha.forcada) aviso('O sistema foi atualizado para a versão ' + (info.atual ? info.atual.versao : '') + ' (atualização obrigatória por compatibilidade).');
      var id = escolha.canal === 'anterior' ? cfg.canais.anterior : cfg.canais.atual;
      msg('Abrindo o SNODO Contracts…');
      respondeu = false;
      iframe.src = cfg.base_app + id + '/exec';
      // Salvaguarda: se a interface não se apresentar (ex.: o Google exigiu login fora do iframe),
      // oferece abrir o sistema diretamente, sem a página de entrada.
      clearTimeout(vigia);
      vigia = setTimeout(function () { if (!respondeu) oferecerAcessoDireto(iframe.src); }, 25000);
    });
  }

  function oferecerAcessoDireto(url) {
    splash.classList.remove('oculto');
    msg('O sistema não respondeu dentro desta página.');
    if (document.getElementById('btn-direto')) return;
    var b = document.createElement('a');
    b.id = 'btn-direto'; b.className = 'btn-direto'; b.href = url; b.target = '_top'; b.rel = 'noopener';
    b.textContent = 'Abrir o SNODO Contracts diretamente';
    splash.appendChild(b);
  }

  iframe.addEventListener('load', function () { if (iframe.src) splash.classList.add('oculto'); });

  // Conversa com a interface (somente origens do HTML Service do Google).
  window.addEventListener('message', function (ev) {
    if (!ORIGEM_APP.test(ev.origin) || !ev.source) return;
    var d = ev.data || {};
    if (d.tipo === 'snodo:ola') {
      respondeu = true; clearTimeout(vigia);
      var direto = document.getElementById('btn-direto'); if (direto) { direto.remove(); splash.classList.add('oculto'); }
      var a = escolha && escolha.aviso;
      ev.source.postMessage({ tipo: 'snodo:atualizacao', disponivel: a ? a.disponivel : null, obrigatoria: a ? a.obrigatoria : false }, ev.origin);
    } else if (d.tipo === 'snodo:aceitar') {
      // Aceite explícito do usuário: passa a usar a versão mais nova.
      splash.classList.remove('oculto');
      msg('Atualizando…');
      buscarInfo(cfg.canais.atual).then(function (atual) {
        gravar(atual ? atual.versao : (info.atual && info.atual.versao));
        return abrir();
      });
    }
  });

  fetch('config.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (c) { cfg = c; if (!cfg.canais || !cfg.canais.atual) { msg('Este ambiente ainda não foi configurado.'); return null; } return abrir(); })
    .catch(function () { msg('Não foi possível carregar o SNODO Contracts. Verifique a conexão e recarregue a página.'); });
})();
