/* eslint-env browser, jquery */
$(function () {
  'use strict';

  var initial = window.__LOGS_INITIAL__ || { logs: [], total: 0, params: {} };
  var state = {
    q: initial.params.search || '',
    action: initial.params.action || '',
    entity: initial.params.entity || '',
    dateFrom: initial.params.dateFrom || '',
    dateTo: initial.params.dateTo || '',
    sortBy: initial.params.sortBy || 'created_at',
    sortDir: initial.params.sortDir || 'desc',
    limit: initial.params.limit || 50,
    offset: initial.params.offset || 0,
  };
  var lastTotal = initial.total;

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function actionStyle(action) {
    if (!action) return { bg: 'var(--surface-2)', color: 'var(--muted)' };
    if (/(fail|err|delete)/.test(action)) return { bg: 'var(--danger-soft)', color: 'var(--danger)' };
    if (/(role|deactivate|warn)/.test(action)) return { bg: 'rgba(255,181,71,0.1)', color: 'var(--warning)' };
    return { bg: 'var(--surface-2)', color: 'var(--muted)' };
  }

  function renderRows(rows) {
    var $tb = $('#logsTbody').empty();
    if (!rows.length) {
      $('#logsEmpty').show();
      return;
    }
    $('#logsEmpty').hide();
    var html = rows.map(function (l) {
      var dt = new Date(l.created_at);
      var dateStr = dt.toLocaleDateString('ru-RU');
      var timeStr = dt.toLocaleTimeString('ru-RU');
      var st = actionStyle(l.action);
      var roleTag = l.role
        ? '<span class="tag" style="margin-left:6px;font-size:9px">' + escapeHtml(l.role) + '</span>'
        : '';
      return ''
        + '<tr>'
        + '<td style="font-family:var(--font-mono);font-size:11px">'
        +   '<span style="color:var(--text)">' + escapeHtml(dateStr) + '</span>'
        +   '<span style="color:var(--muted);margin-left:5px">' + escapeHtml(timeStr) + '</span>'
        + '</td>'
        + '<td><span style="font-size:13px">' + escapeHtml(l.username || '—') + '</span>' + roleTag + '</td>'
        + '<td>'
        +   '<span style="font-family:var(--font-mono);font-size:11px;padding:2px 7px;border-radius:2px;'
        +     'background:' + st.bg + ';color:' + st.color + '">'
        +     escapeHtml(l.action) + '</span>'
        + '</td>'
        + '<td style="font-family:var(--font-mono);font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">'
        +   escapeHtml(l.entity || '—') + '</td>'
        + '<td style="font-family:var(--font-mono);font-size:11px;color:var(--ink-2)">' + escapeHtml(l.entity_id || '—') + '</td>'
        + '<td style="font-family:var(--font-mono);font-size:11px;color:var(--ink-2)">' + escapeHtml(l.ip || '—') + '</td>'
        + '</tr>';
    }).join('');
    $tb.html(html);
  }

  function renderSortIndicators() {
    $('.js-sort').removeClass('sort-active').find('.sort-ind').text('');
    var $th = $('.js-sort[data-sort="' + state.sortBy + '"]');
    $th.addClass('sort-active');
    $th.find('.sort-ind').text(state.sortDir === 'asc' ? '↑' : '↓');
  }

  function renderPagination(total) {
    var $pag = $('#logsPagination').empty();
    var pages = Math.max(1, Math.ceil(total / state.limit));
    var current = Math.floor(state.offset / state.limit) + 1;
    if (current > pages) current = pages;

    var from = total === 0 ? 0 : state.offset + 1;
    var to = Math.min(state.offset + state.limit, total);
    $('#logsStat').text(total === 0 ? 'Нет записей' : (from + '–' + to + ' из ' + total));

    if (pages <= 1) return;

    function btn(label, page, opts) {
      opts = opts || {};
      var $b = $('<button class="btn btn-sm' + (opts.active ? ' active' : '') + '">' + label + '</button>');
      $b.prop('disabled', !!opts.disabled);
      if (!opts.disabled) {
        $b.on('click', function () {
          state.offset = (page - 1) * state.limit;
          load();
        });
      }
      return $b;
    }

    $pag.append(btn('‹', current - 1, { disabled: current === 1 }));

    var range = [];
    var add = function (p) { if (p >= 1 && p <= pages && range.indexOf(p) === -1) range.push(p); };
    add(1); add(pages);
    for (var i = current - 2; i <= current + 2; i++) add(i);
    range.sort(function (a, b) { return a - b; });

    var prev = 0;
    range.forEach(function (p) {
      if (p - prev > 1) $pag.append('<span class="page-info" style="margin:0 4px">…</span>');
      $pag.append(btn(String(p), p, { active: p === current }));
      prev = p;
    });

    $pag.append(btn('›', current + 1, { disabled: current === pages }));
  }

  var loadSeq = 0;
  function load() {
    var seq = ++loadSeq;
    var query = {
      q: state.q || undefined,
      action: state.action || undefined,
      entity: state.entity || undefined,
      dateFrom: state.dateFrom || undefined,
      dateTo: state.dateTo || undefined,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      limit: state.limit,
      offset: state.offset,
    };
    $.getJSON('/admin/api/audit', query).done(function (resp) {
      if (seq !== loadSeq) return;
      var rows = resp.data || [];
      var total = (resp.meta && resp.meta.total) || 0;
      lastTotal = total;
      renderRows(rows);
      renderPagination(total);
      renderSortIndicators();
    }).fail(function (xhr) {
      if (seq !== loadSeq) return;
      toast(xhrErr(xhr), 'error');
    });
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  $('#fSearch').on('input', debounce(function () {
    state.q = this.value.trim(); state.offset = 0; load();
  }, 250));
  $('#fAction').on('change', function () { state.action = this.value; state.offset = 0; load(); });
  $('#fEntity').on('change', function () { state.entity = this.value; state.offset = 0; load(); });
  $('#fDateFrom').on('change', function () { state.dateFrom = this.value; state.offset = 0; load(); });
  $('#fDateTo').on('change', function () { state.dateTo = this.value; state.offset = 0; load(); });
  $('#fPageSize').on('change', function () { state.limit = parseInt(this.value, 10); state.offset = 0; load(); });

  $('#fReset').on('click', function () {
    state.q = state.action = state.entity = state.dateFrom = state.dateTo = '';
    state.sortBy = 'created_at'; state.sortDir = 'desc';
    state.offset = 0;
    $('#fSearch').val(''); $('#fAction').val(''); $('#fEntity').val('');
    $('#fDateFrom').val(''); $('#fDateTo').val('');
    load();
  });

  $('.js-sort').on('click', function () {
    var col = $(this).data('sort');
    if (state.sortBy === col) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortBy = col;
      state.sortDir = 'desc';
    }
    state.offset = 0;
    load();
  });

  $('#btnExport').on('click', function () {
    var query = {
      q: state.q || undefined,
      action: state.action || undefined,
      entity: state.entity || undefined,
      dateFrom: state.dateFrom || undefined,
      dateTo: state.dateTo || undefined,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      limit: 5000, offset: 0,
    };
    $.getJSON('/admin/api/audit', query).done(function (resp) {
      var rows = [['Дата', 'Время', 'Пользователь', 'Email', 'Роль', 'Действие', 'Сущность', 'ID', 'IP']];
      (resp.data || []).forEach(function (l) {
        var dt = new Date(l.created_at);
        rows.push([
          dt.toLocaleDateString('ru-RU'),
          dt.toLocaleTimeString('ru-RU'),
          l.username || '',
          l.email || '',
          l.role || '',
          l.action || '',
          l.entity || '',
          l.entity_id == null ? '' : l.entity_id,
          l.ip || '',
        ]);
      });
      var csv = '﻿' + rows.map(function (r) {
        return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
      }).join('\n');
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'audit-' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click();
    }).fail(function (xhr) { toast(xhrErr(xhr), 'error'); });
  });

  // Первичная отрисовка из server-rendered данных
  renderRows(initial.logs);
  renderPagination(lastTotal);
  renderSortIndicators();
});
