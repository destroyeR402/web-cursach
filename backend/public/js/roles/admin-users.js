/* eslint-env browser, jquery */
$(function () {
  'use strict';

  var initial = window.__USERS_INITIAL__ || { users: [], total: 0, params: {}, roles: [], channels: [] };
  var roles = initial.roles;
  var channels = initial.channels;

  var state = {
    q: initial.params.search || '',
    role: initial.params.role || '',
    isActive: initial.params.isActive === true ? 'true' : initial.params.isActive === false ? 'false' : '',
    sortBy: initial.params.sortBy || 'created_at',
    sortDir: initial.params.sortDir || 'desc',
    limit: initial.params.limit || 20,
    offset: initial.params.offset || 0,
  };

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function roleOptions(selected) {
    return roles.map(function (r) {
      return '<option value="' + escapeHtml(r.code) + '"' + (r.code === selected ? ' selected' : '') + '>' + escapeHtml(r.code) + '</option>';
    }).join('');
  }

  function channelOptions() {
    return channels.map(function (c) {
      return '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>';
    }).join('');
  }

  function renderRows(rows) {
    var $tb = $('#usersTbody').empty();
    if (!rows.length) {
      $('#usersEmpty').show();
      return;
    }
    $('#usersEmpty').hide();

    var html = rows.map(function (u) {
      var created = new Date(u.created_at).toLocaleDateString('ru-RU');
      var assign = u.role === 'editor'
        ? '<select class="js-assign select" data-user-id="' + u.id + '" style="padding:6px 10px;font-size:12px;width:100%">'
          + '<option value="">— закрепить за каналом —</option>'
          + channelOptions()
          + '</select>'
        : '<span class="mono muted" style="font-size:11px;text-transform:uppercase;letter-spacing:.08em">— н/п —</span>';

      var activeColor = u.is_active ? 'var(--success)' : 'var(--muted)';
      var activeText = u.is_active ? '● ON' : '○ OFF';

      return ''
        + '<tr data-id="' + u.id + '">'
        +   '<td class="mono" style="font-size:11px;color:var(--ink-2)">' + u.id + '</td>'
        +   '<td>'
        +     '<div>' + escapeHtml(u.email) + '</div>'
        +     '<div class="user-login">@' + escapeHtml(u.username) + '</div>'
        +   '</td>'
        +   '<td>' + escapeHtml(u.display_name || '—') + '</td>'
        +   '<td>'
        +     '<select class="js-role select role-select-cell role-' + u.role + '" data-id="' + u.id + '">'
        +       roleOptions(u.role)
        +     '</select>'
        +   '</td>'
        +   '<td>'
        +     '<label style="display:inline-flex;gap:6px;align-items:center;cursor:pointer">'
        +       '<input type="checkbox" class="js-active" data-id="' + u.id + '"' + (u.is_active ? ' checked' : '') + '>'
        +       '<span class="user-active-tag" style="color:' + activeColor + '">' + activeText + '</span>'
        +     '</label>'
        +   '</td>'
        +   '<td class="mono" style="font-size:11px;color:var(--ink-2)">' + created + '</td>'
        +   '<td>' + assign + '</td>'
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
    var $pag = $('#usersPagination').empty();
    var pages = Math.max(1, Math.ceil(total / state.limit));
    var current = Math.floor(state.offset / state.limit) + 1;
    if (current > pages) current = pages;

    var from = total === 0 ? 0 : state.offset + 1;
    var to = Math.min(state.offset + state.limit, total);
    $('#usersStat').text(total === 0 ? 'Нет пользователей' : (from + '–' + to + ' из ' + total));
    $('#usersTotalHeader').text('· ' + total);

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
      role: state.role || undefined,
      isActive: state.isActive || undefined,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      limit: state.limit,
      offset: state.offset,
    };
    $.getJSON('/admin/api/users', query).done(function (resp) {
      if (seq !== loadSeq) return;
      var rows = resp.data || [];
      var total = (resp.meta && resp.meta.total) || 0;
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
  $('#fRole').on('change', function () { state.role = this.value; state.offset = 0; load(); });
  $('#fStatus').on('change', function () { state.isActive = this.value; state.offset = 0; load(); });
  $('#fPageSize').on('change', function () { state.limit = parseInt(this.value, 10); state.offset = 0; load(); });

  $('.js-sort').on('click', function () {
    var col = $(this).data('sort');
    if (state.sortBy === col) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortBy = col;
      state.sortDir = 'asc';
    }
    state.offset = 0;
    load();
  });

  // === Действия со строкой (без перезагрузки таблицы) ===
  $(document).on('change', '.js-role', function () {
    var $sel = $(this);
    var id = $sel.data('id');
    var role = $sel.val();
    var prev = $sel.data('prev') || $sel.find('option[selected]').val();
    $sel.data('prev', $sel.find('option:selected').val());
    $sel.prop('disabled', true);

    $.ajax({
      url: '/admin/api/users/' + id + '/role',
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify({ role: role }),
    }).done(function () {
      toast('Роль пользователя #' + id + ' изменена на «' + role + '»');
      $sel.data('prev', role);
      $sel.removeClass(function (_, cls) { return (cls.match(/role-\S+/g) || []).join(' '); }).addClass('role-' + role);
      load();
    }).fail(function (xhr) {
      $sel.val(prev);
      toast(xhrErr(xhr), 'error');
    }).always(function () {
      $sel.prop('disabled', false);
    });
  });

  $(document).on('change', '.js-active', function () {
    var $cb = $(this);
    var id = $cb.data('id');
    var isActive = $cb.is(':checked');
    $cb.prop('disabled', true);

    $.ajax({
      url: '/admin/api/users/' + id + '/active',
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify({ isActive: isActive }),
    }).done(function () {
      toast('Пользователь #' + id + ' ' + (isActive ? 'активирован' : 'деактивирован'));
      var $tag = $cb.siblings('.user-active-tag');
      $tag.css('color', isActive ? 'var(--success)' : 'var(--muted)').text(isActive ? '● ON' : '○ OFF');
    }).fail(function (xhr) {
      $cb.prop('checked', !isActive);
      toast(xhrErr(xhr), 'error');
    }).always(function () {
      $cb.prop('disabled', false);
    });
  });

  $(document).on('change', '.js-assign', function () {
    var $sel = $(this);
    var userId = $sel.data('user-id');
    var channelId = $sel.val();
    if (!channelId) return;
    $sel.prop('disabled', true);

    $.ajax({
      url: '/admin/api/channels/editors',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ userId: userId, channelId: channelId }),
    }).done(function () {
      toast('Редактор закреплён за каналом');
      $sel.val('');
    }).fail(function (xhr) {
      toast(xhrErr(xhr), 'error');
    }).always(function () {
      $sel.prop('disabled', false);
    });
  });

  renderRows(initial.users);
  renderPagination(initial.total);
  renderSortIndicators();
});
