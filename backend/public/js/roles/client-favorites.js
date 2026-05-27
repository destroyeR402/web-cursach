/* eslint-env browser, jquery */
$(function () {
  'use strict';

  var initial = window.__FAVORITES_INITIAL__ || {};

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
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

  function paginationBtn(label, page, opts, onClick) {
    opts = opts || {};
    var $b = $('<button class="btn btn-sm' + (opts.active ? ' active' : '') + '">' + label + '</button>');
    $b.prop('disabled', !!opts.disabled);
    if (!opts.disabled) $b.on('click', function () { onClick(page); });
    return $b;
  }

  function renderPaginationInto($pag, total, state, onPage) {
    $pag.empty();
    var pages = Math.max(1, Math.ceil(total / state.limit));
    var current = Math.floor(state.offset / state.limit) + 1;
    if (current > pages) current = pages;

    if (pages <= 1) return;
    $pag.append(paginationBtn('‹', current - 1, { disabled: current === 1 }, onPage));
    var range = [];
    var add = function (p) { if (p >= 1 && p <= pages && range.indexOf(p) === -1) range.push(p); };
    add(1); add(pages);
    for (var i = current - 2; i <= current + 2; i++) add(i);
    range.sort(function (a, b) { return a - b; });
    var prev = 0;
    range.forEach(function (p) {
      if (p - prev > 1) $pag.append('<span class="page-info" style="margin:0 4px">…</span>');
      $pag.append(paginationBtn(String(p), p, { active: p === current }, onPage));
      prev = p;
    });
    $pag.append(paginationBtn('›', current + 1, { disabled: current === pages }, onPage));
  }

  // ============================================================
  // КАНАЛЫ
  // ============================================================
  function buildChannelCard(c) {
    var inactive = c.is_active ? '' : ' is-inactive';
    return ''
      + '<div class="fav-card-channel' + inactive + '" data-id="' + c.id + '">'
      +   '<div class="ch-num">' + String(c.id).padStart(2, '0') + '</div>'
      +   '<div>'
      +     '<h4>' + escapeHtml(c.name) + '</h4>'
      +     '<div class="ch-cat">' + escapeHtml(c.category || 'Канал') + (c.is_active ? '' : ' · выключен') + '</div>'
      +     '<div class="ch-actions">'
      +       '<a class="btn btn-sm" href="/">Расписание</a>'
      +       '<button class="btn btn-sm btn-danger js-fav-remove" data-type="channel" data-id="' + c.id + '">★ Убрать</button>'
      +     '</div>'
      +   '</div>'
      + '</div>';
  }

  function channelsRender(rows) {
    var $grid = $('#channelsGrid').empty();
    if (!rows.length) { $('#channelsEmpty').show(); return; }
    $('#channelsEmpty').hide();
    $grid.html(rows.map(buildChannelCard).join(''));
  }

  var loadChannels = null;
  var loadPrograms = null;

  if (initial.totalChannels > 0) {
    var chState = {
      q: initial.chParams.search || '',
      sortBy: initial.chParams.sortBy || 'added_at',
      sortDir: initial.chParams.sortDir || 'desc',
      limit: initial.chParams.limit || 12,
      offset: initial.chParams.offset || 0,
    };
    var chSeq = 0;

    loadChannels = function () {
      var seq = ++chSeq;
      $.getJSON('/client/api/favorites/items', {
        kind: 'channel',
        q_channel: chState.q || undefined,
        s_channel: chState.sortBy,
        d_channel: chState.sortDir,
        l_channel: chState.limit,
        o_channel: chState.offset,
      }).done(function (resp) {
        if (seq !== chSeq) return;
        var rows = resp.data || [];
        var total = (resp.meta && resp.meta.total) || 0;
        channelsRender(rows);
        var from = total === 0 ? 0 : chState.offset + 1;
        var to = Math.min(chState.offset + chState.limit, total);
        $('#channelsStat').text(total === 0 ? 'Каналов нет' : (from + '–' + to + ' из ' + total));
        $('#channelsSub').text(total + ' каналов');
        renderPaginationInto($('#channelsPagination'), total, chState, function (p) {
          chState.offset = (p - 1) * chState.limit;
          loadChannels();
        });
      }).fail(function (xhr) {
        if (seq !== chSeq) return;
        toast(xhrErr(xhr), 'error');
      });
    }

    };

    $('#chSearch').on('input', debounce(function () {
      chState.q = this.value.trim(); chState.offset = 0; loadChannels();
    }, 250));
    $('#chSort').on('change', function () {
      var parts = this.value.split(':');
      chState.sortBy = parts[0]; chState.sortDir = parts[1] || 'desc';
      chState.offset = 0; loadChannels();
    });

    channelsRender(initial.channels);
    var total0 = initial.totalChannels;
    var from0 = total0 === 0 ? 0 : chState.offset + 1;
    var to0 = Math.min(chState.offset + chState.limit, total0);
    $('#channelsStat').text(total0 === 0 ? 'Каналов нет' : (from0 + '–' + to0 + ' из ' + total0));
    renderPaginationInto($('#channelsPagination'), total0, chState, function (p) {
      chState.offset = (p - 1) * chState.limit;
      loadChannels();
    });
  }

  // ============================================================
  // ПЕРЕДАЧИ
  // ============================================================
  function buildProgramCard(p) {
    var poster = p.poster_path
      ? '<img src="' + escapeHtml(p.poster_path) + '" alt="">'
      : '<div class="fav-poster-ph">' + escapeHtml(p.title.charAt(0).toUpperCase()) + '</div>';

    var meta = [];
    if (p.genre_name) meta.push(escapeHtml(p.genre_name));
    if (p.duration_min) meta.push(p.duration_min + ' мин');
    if (p.age_code) meta.push(escapeHtml(p.age_code));

    var emailOn = !!p.notify_email;
    var pushOn = !!p.notify_push;

    return ''
      + '<article class="fav-card-program" data-id="' + p.id + '">'
      +   '<div class="fav-poster">' + poster + '</div>'
      +   '<h4>' + escapeHtml(p.title) + '</h4>'
      +   '<div class="pr-meta">' + meta.join(' · ') + '</div>'
      +   '<div class="notify-toggles">'
      +     '<label class="notify-pill js-notify' + (emailOn ? ' is-on' : '') + '" data-channel="email" data-id="' + p.id + '" title="Email-уведомления">'
      +       '<input type="checkbox"' + (emailOn ? ' checked' : '') + '> ✉ Email'
      +     '</label>'
      +     '<label class="notify-pill js-notify' + (pushOn ? ' is-on' : '') + '" data-channel="push" data-id="' + p.id + '" title="Push-уведомления">'
      +       '<input type="checkbox"' + (pushOn ? ' checked' : '') + '> ⌁ Push'
      +     '</label>'
      +   '</div>'
      +   '<div class="pr-actions">'
      +     '<span class="mono" style="font-size:9.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em">'
      +       'добавлено ' + new Date(p.added_at).toLocaleDateString('ru-RU')
      +     '</span>'
      +     '<button class="btn btn-sm btn-danger js-fav-remove" data-type="program" data-id="' + p.id + '">★ Убрать</button>'
      +   '</div>'
      + '</article>';
  }

  function programsRender(rows) {
    var $grid = $('#programsGrid').empty();
    if (!rows.length) { $('#programsEmpty').show(); return; }
    $('#programsEmpty').hide();
    $grid.html(rows.map(buildProgramCard).join(''));
  }

  if (initial.totalPrograms > 0) {
    var prState = {
      q: initial.prParams.search || '',
      sortBy: initial.prParams.sortBy || 'added_at',
      sortDir: initial.prParams.sortDir || 'desc',
      limit: initial.prParams.limit || 12,
      offset: initial.prParams.offset || 0,
    };
    var prSeq = 0;

    loadPrograms = function () {
      var seq = ++prSeq;
      $.getJSON('/client/api/favorites/items', {
        kind: 'program',
        q_program: prState.q || undefined,
        s_program: prState.sortBy,
        d_program: prState.sortDir,
        l_program: prState.limit,
        o_program: prState.offset,
      }).done(function (resp) {
        if (seq !== prSeq) return;
        var rows = resp.data || [];
        var total = (resp.meta && resp.meta.total) || 0;
        programsRender(rows);
        var from = total === 0 ? 0 : prState.offset + 1;
        var to = Math.min(prState.offset + prState.limit, total);
        $('#programsStat').text(total === 0 ? 'Передач нет' : (from + '–' + to + ' из ' + total));
        $('#programsSub').text(total + ' передач · уведомления приходят по подписке');
        renderPaginationInto($('#programsPagination'), total, prState, function (p) {
          prState.offset = (p - 1) * prState.limit;
          loadPrograms();
        });
      }).fail(function (xhr) {
        if (seq !== prSeq) return;
        toast(xhrErr(xhr), 'error');
      });
    };

    $('#prSearch').on('input', debounce(function () {
      prState.q = this.value.trim(); prState.offset = 0; loadPrograms();
    }, 250));
    $('#prSort').on('change', function () {
      var parts = this.value.split(':');
      prState.sortBy = parts[0]; prState.sortDir = parts[1] || 'desc';
      prState.offset = 0; loadPrograms();
    });

    programsRender(initial.programs);
    var totalP0 = initial.totalPrograms;
    var fromP0 = totalP0 === 0 ? 0 : prState.offset + 1;
    var toP0 = Math.min(prState.offset + prState.limit, totalP0);
    $('#programsStat').text(totalP0 === 0 ? 'Передач нет' : (fromP0 + '–' + toP0 + ' из ' + totalP0));
    renderPaginationInto($('#programsPagination'), totalP0, prState, function (p) {
      prState.offset = (p - 1) * prState.limit;
      loadPrograms();
    });
  }

  // ============================================================
  // КАРУСЕЛЬ
  // ============================================================
  var $car = $('#favCarousel');
  if ($car.length) {
    function carouselStep() {
      var first = $car.children()[0];
      if (!first) return 200;
      return first.getBoundingClientRect().width + 14;
    }
    $('#carouselPrev').on('click', function () {
      $car[0].scrollBy({ left: -carouselStep(), behavior: 'smooth' });
    });
    $('#carouselNext').on('click', function () {
      $car[0].scrollBy({ left: carouselStep(), behavior: 'smooth' });
    });
  }

  // ============================================================
  // УДАЛЕНИЕ ИЗ ИЗБРАННОГО (с обновлением секции)
  // ============================================================
  $(document).on('click', '.js-fav-remove', function (e) {
    e.preventDefault();
    var $btn = $(this);
    var type = $btn.data('type');
    var id = parseInt($btn.data('id'), 10);
    if (!confirm('Убрать из избранного?')) return;
    $btn.prop('disabled', true);

    $.ajax({
      url: '/client/api/favorites/' + type + '/' + id,
      method: 'DELETE',
    }).done(function () {
      toast('Убрано из избранного');
      if (type === 'channel' && loadChannels) loadChannels();
      else if (type === 'program' && loadPrograms) loadPrograms();
      if (type === 'program') $('#favCarousel [data-program-id="' + id + '"]').remove();
    }).fail(function (xhr) {
      $btn.prop('disabled', false);
      toast(xhrErr(xhr), 'error');
    });
  });

  // ============================================================
  // ТОГГЛЫ EMAIL / PUSH для передач
  // ============================================================
  $(document).on('click', '.js-notify', function (e) {
    var $pill = $(this);
    // <label> сам триггерит change в checkbox; нам важна логика после
    // Подождём микротик, чтобы checkbox обновился
    setTimeout(function () {
      var $card = $pill.closest('.fav-card-program');
      var id = parseInt($pill.data('id'), 10);
      var $email = $card.find('.js-notify[data-channel="email"] input');
      var $push  = $card.find('.js-notify[data-channel="push"]  input');
      var email = $email.is(':checked');
      var push = $push.is(':checked');

      $card.find('.js-notify').addClass('disabled').css('pointer-events', 'none');

      function done() {
        $card.find('.js-notify').removeClass('disabled').css('pointer-events', '');
        $card.find('.js-notify[data-channel="email"]').toggleClass('is-on', email);
        $card.find('.js-notify[data-channel="push"]').toggleClass('is-on', push);
      }
      function fail(xhr) {
        // откатываем
        $email.prop('checked', !email);
        $push.prop('checked', !push);
        done();
        toast(xhrErr(xhr), 'error');
      }

      if (!email && !push) {
        // оба выключены — удаляем подписку
        $.ajax({
          url: '/client/api/subscriptions/program/' + id,
          method: 'DELETE',
        }).done(function () {
          toast('Уведомления выключены');
          done();
        }).fail(fail);
      } else {
        $.ajax({
          url: '/client/api/subscriptions',
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({ type: 'program', targetId: id, notifyEmail: email, notifyPush: push }),
        }).done(function () {
          toast(email && push ? 'Email + Push включены'
                : email ? 'Email включён'
                : push ? 'Push включён' : 'Уведомления обновлены');
          done();
        }).fail(fail);
      }
    }, 0);
  });
});
