/* eslint-env browser, jquery */
$(function () {
  'use strict';

  var initial = window.__CHANNELS_INITIAL__ || { channels: [], total: 0, params: {}, activity: {} };

  var state = {
    q: initial.params.search || '',
    category: initial.params.category || '',
    isActive: initial.params.isActive === true ? 'true' : initial.params.isActive === false ? 'false' : '',
    sortBy: initial.params.sortBy || 'name',
    sortDir: initial.params.sortDir || 'asc',
    limit: initial.params.limit || 20,
    offset: initial.params.offset || 0,
  };

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function buildRow(c) {
    var logo = c.logo_path
      ? '<img src="' + escapeHtml(c.logo_path) + '" class="thumb" alt="">'
      : '<div class="thumb-placeholder">' + escapeHtml(c.name.charAt(0).toUpperCase()) + '</div>';

    var activeColor = c.is_active ? 'var(--success)' : 'var(--muted)';
    var activeText = c.is_active ? '● онлайн' : '○ выкл.';

    return ''
      + '<tr data-id="' + c.id + '"'
      +   ' data-name="' + escapeHtml(c.name) + '"'
      +   ' data-slug="' + escapeHtml(c.slug) + '"'
      +   ' data-category="' + escapeHtml(c.category || '') + '"'
      +   ' data-description="' + escapeHtml(c.description || '') + '"'
      +   ' data-active="' + (c.is_active ? 'true' : 'false') + '">'
      + '<td>' + logo + '</td>'
      + '<td class="mono" style="font-size:11px;color:var(--ink-2)">' + String(c.id).padStart(2, '0') + '</td>'
      + '<td><strong>' + escapeHtml(c.name) + '</strong></td>'
      + '<td><code>/' + escapeHtml(c.slug) + '</code></td>'
      + '<td>' + (c.category ? '<span class="tag" style="font-size:10px">' + escapeHtml(c.category) + '</span>' : '<span class="muted">—</span>') + '</td>'
      + '<td><span class="channel-active-tag" style="color:' + activeColor + '">' + activeText + '</span></td>'
      + '<td class="desc-cell">' + escapeHtml(c.description || '') + '</td>'
      + '<td class="actions-cell">'
      +   '<button class="btn btn-sm js-edit" data-id="' + c.id + '" title="Редактировать">✎</button> '
      +   '<button class="btn btn-sm btn-danger js-del" data-id="' + c.id + '" title="Удалить">×</button>'
      + '</td></tr>';
  }

  function renderRows(rows) {
    var $tb = $('#channelsTbody').empty();
    if (!rows.length) {
      $('#channelsEmpty').show();
      return;
    }
    $('#channelsEmpty').hide();
    $tb.html(rows.map(buildRow).join(''));
  }

  function renderSortIndicators() {
    $('.js-sort').removeClass('sort-active').find('.sort-ind').text('');
    var $th = $('.js-sort[data-sort="' + state.sortBy + '"]');
    $th.addClass('sort-active');
    $th.find('.sort-ind').text(state.sortDir === 'asc' ? '↑' : '↓');
  }

  function renderPagination(total) {
    var $pag = $('#channelsPagination').empty();
    var pages = Math.max(1, Math.ceil(total / state.limit));
    var current = Math.floor(state.offset / state.limit) + 1;
    if (current > pages) current = pages;

    var from = total === 0 ? 0 : state.offset + 1;
    var to = Math.min(state.offset + state.limit, total);
    $('#channelsStat').text(total === 0 ? 'Каналов нет' : (from + '–' + to + ' из ' + total));

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
      category: state.category || undefined,
      isActive: state.isActive || undefined,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      limit: state.limit,
      offset: state.offset,
    };
    $.getJSON('/admin/api/channels', query).done(function (resp) {
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
  $('#fCategory').on('change', function () { state.category = this.value; state.offset = 0; load(); });
  $('#fStatus').on('change', function () { state.isActive = this.value; state.offset = 0; load(); });
  $('#fPageSize').on('change', function () { state.limit = parseInt(this.value, 10); state.offset = 0; load(); });

  $('#fReset').on('click', function () {
    state.q = state.category = state.isActive = '';
    state.sortBy = 'name'; state.sortDir = 'asc';
    state.offset = 0;
    $('#fSearch').val(''); $('#fCategory').val(''); $('#fStatus').val('');
    load();
  });

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

  // === Форма создания/редактирования ===
  var $form = $('#channelForm');
  var $title = $('#formTitle');
  var $submit = $('#btnSubmit');
  var $preview = $('#logoPreview');
  var $block = $('#formBlock');

  function resetForm() {
    $form[0].reset();
    $form.find('[name=_id]').val('');
    $form.find('[name=slug]').prop('disabled', false);
    $title.text('+ Добавить канал');
    $submit.text('Создать');
    $preview.hide();
  }

  $('#btnOpenForm').on('click', function () {
    $block.attr('open', 'open');
    $('html, body').animate({ scrollTop: $block.offset().top - 80 }, 200);
  });

  $('#logoInput').on('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) { $preview.hide(); return; }
    var r = new FileReader();
    r.onload = function (ev) { $preview.attr('src', ev.target.result).show(); };
    r.readAsDataURL(f);
  });

  $(document).on('click', '.js-edit', function () {
    var $row = $(this).closest('tr');
    $form.find('[name=_id]').val($row.data('id'));
    $form.find('[name=name]').val($row.data('name'));
    $form.find('[name=slug]').val($row.data('slug')).prop('disabled', true);
    $form.find('[name=category]').val($row.data('category'));
    $form.find('[name=description]').val($row.data('description'));
    $form.find('[name=isActive]').val(String($row.data('active')));
    $title.text('Редактировать канал #' + $row.data('id'));
    $submit.text('Сохранить');
    $block.attr('open', 'open');
    $('html, body').animate({ scrollTop: $form.offset().top - 80 }, 200);
  });

  $(document).on('click', '.js-del', function () {
    var id = $(this).data('id');
    if (!confirm('Удалить канал #' + id + '? Все его слоты тоже удалятся.')) return;
    var $btn = $(this).prop('disabled', true);
    $.ajax({ url: '/api/channels/' + id, method: 'DELETE' })
      .done(function () {
        toast('Канал удалён');
        load();
      })
      .fail(function (xhr) {
        $btn.prop('disabled', false);
        toast(xhrErr(xhr), 'error');
      });
  });

  $('#btnReset').on('click', resetForm);

  $form.on('submit', function (e) {
    e.preventDefault();
    var id = $form.find('[name=_id]').val();
    var fd = new FormData(this);
    var method = id ? 'PATCH' : 'POST';
    var url = id ? ('/api/channels/' + id) : '/api/channels';
    fd.delete('_id');
    if (id) fd.delete('slug');

    $submit.prop('disabled', true).text(id ? 'Сохранение…' : 'Создание…');

    $.ajax({ url: url, method: method, data: fd, processData: false, contentType: false })
      .done(function (resp) {
        toast('Канал «' + (resp.data && resp.data.name) + '» ' + (id ? 'обновлён' : 'создан'));
        resetForm();
        $block.removeAttr('open');
        load();
      })
      .fail(function (xhr) {
        toast(xhrErr(xhr), 'error');
      })
      .always(function () {
        $submit.prop('disabled', false).text(id ? 'Сохранить' : 'Создать');
      });
  });

  renderRows(initial.channels);
  renderPagination(initial.total);
  renderSortIndicators();
});
