/* eslint-env browser, jquery */
(function () {
  'use strict';

  var $timeline    = $('#timeline');
  if (!$timeline.length) return;

  var PX_PER_MIN = 2;
  var SNAP_MIN   = 5;
  var TOTAL_MINS = 1440;

  var channelId     = parseInt($timeline.data('channel-id'), 10) || 0;
  var date          = $timeline.data('date') || new Date().toISOString().slice(0, 10);
  var $conflict     = $('#conflictBox');
  var $timelineWrap = $('.gb-timeline-wrap');
  var dragging      = null;
  var $ghost        = $('#dragGhost');

  // ──────────────────────────────────────────────────────────────────
  // Утилиты
  // ──────────────────────────────────────────────────────────────────
  function pad(n) { return String(n).padStart(2, '0'); }
  function minToStr(m) {
    var t = ((m % TOTAL_MINS) + TOTAL_MINS) % TOTAL_MINS;
    return pad(Math.floor(t / 60)) + ':' + pad(t % 60);
  }
  function fmtTime(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // Геометрия слота относительно ПРОСМАТРИВАЕМОГО дня.
  // Слот может «торчать» снизу (заходит на завтра) или начинаться
  // раньше 00:00 (хвост со вчера) — клипуем по краям 0..1440.
  // ──────────────────────────────────────────────────────────────────
  function viewDayStartMs() {
    var p = date.split('-');
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 0, 0, 0, 0).getTime();
  }
  function slotGeom(startsAt, endsAt) {
    var start = new Date(startsAt);
    var end   = new Date(endsAt);
    var startMin = Math.round((start.getTime() - viewDayStartMs()) / 60000);
    var endMin   = Math.round((end.getTime()   - viewDayStartMs()) / 60000);
    var visStart = Math.max(0, startMin);
    var visEnd   = Math.min(TOTAL_MINS, endMin);
    return {
      start: start, end: end,
      startMin: startMin, endMin: endMin,
      topPx: visStart * PX_PER_MIN,
      heightPx: Math.max(PX_PER_MIN * 5, (visEnd - visStart) * PX_PER_MIN),
      contPrev: startMin < 0,
      contNext: endMin > TOTAL_MINS,
    };
  }
  function applyGeom($tile, g) {
    $tile.css({ top: g.topPx + 'px', height: g.heightPx + 'px' });
    $tile.toggleClass('cont-prev', g.contPrev);
    $tile.toggleClass('cont-next', g.contNext);
    $tile.attr('data-starts-at', g.start.toISOString());
    $tile.attr('data-ends-at',   g.end.toISOString());
    $tile.find('.gb-slot-time').text(fmtTime(g.start) + '–' + fmtTime(g.end));
  }

  function renderSlot(slot) {
    var g = slotGeom(slot.starts_at, slot.ends_at);
    var cls = 'gb-slot';
    if (slot.is_published) cls += ' published';
    if (g.contPrev) cls += ' cont-prev';
    if (g.contNext) cls += ' cont-next';

    var $tile = $(
      '<div class="' + cls + '" data-slot-id="' + slot.id + '"' +
           ' data-starts-at="' + g.start.toISOString() + '"' +
           ' data-ends-at="'   + g.end.toISOString()   + '">' +
        '<div class="gb-slot-resize gb-slot-resize-top" title="Перетащить начало"></div>' +
        '<div class="gb-slot-body">' +
          '<span class="gb-slot-time">' + fmtTime(g.start) + '–' + fmtTime(g.end) + '</span>' +
          '<span class="gb-slot-title">' + esc(slot.program_title || '') + '</span>' +
        '</div>' +
        '<button class="js-del-slot" title="Удалить">×</button>' +
        '<div class="gb-slot-resize gb-slot-resize-bottom" title="Перетащить конец"></div>' +
      '</div>'
    );
    $tile.css({ top: g.topPx + 'px', height: g.heightPx + 'px' });
    $timeline.append($tile);
  }

  // Делегированный обработчик удаления — работает и для SSR-слотов, и для добавленных через JS
  $timeline.on('click', '.js-del-slot', function (e) {
    e.stopPropagation();
    var $tile = $(this).closest('.gb-slot');
    var slotId = parseInt($tile.data('slot-id'), 10);
    if (slotId) removeSlot(slotId, $tile);
  });

  // ──────────────────────────────────────────────────────────────────
  // Загрузка слотов через AJAX
  // ──────────────────────────────────────────────────────────────────
  function loadSlots() {
    $timeline.find('.gb-slot').remove();
    $conflict.hide();
    $timeline.addClass('gb-loading');

    $.get('/api/schedule', { channelId: channelId, date: date, draft: '1' })
      .done(function (resp) {
        var slots = Array.isArray(resp.data) ? resp.data : [];
        slots.forEach(renderSlot);

        var targetMin;
        if (slots.length) {
          var first = new Date(slots[0].starts_at);
          targetMin = Math.max(0, first.getHours() * 60 + first.getMinutes() - 30);
        } else {
          var now = new Date();
          targetMin = Math.max(0, now.getHours() * 60 + now.getMinutes() - 60);
        }
        $timelineWrap.scrollTop(targetMin * PX_PER_MIN);
      })
      .fail(function (xhr) {
        toast(xhrErr(xhr), 'error');
      })
      .always(function () {
        $timeline.removeClass('gb-loading');
      });
  }

  // На старте слоты уже отрисованы SSR-ом — не дёргаем loadSlots().
  // Только прокручиваем таймлайн к первому слоту (или к текущему часу, если слотов нет).
  (function initialScroll() {
    var $first = $timeline.find('.gb-slot').first();
    var targetMin;
    if ($first.length) {
      targetMin = Math.max(0, parseInt($first.css('top'), 10) / PX_PER_MIN - 30);
    } else {
      var now = new Date();
      targetMin = Math.max(0, now.getHours() * 60 + now.getMinutes() - 60);
    }
    $timelineWrap.scrollTop(targetMin * PX_PER_MIN);
  })();

  // ──────────────────────────────────────────────────────────────────
  // Навигация — AJAX, без перезагрузки страницы
  // ──────────────────────────────────────────────────────────────────
  function applyState() {
    $timeline.attr('data-channel-id', channelId).attr('data-date', date);
    $('#datePicker').val(date);
    history.replaceState(null, '', '/admin/grid?channelId=' + channelId + '&date=' + date);
    $('#btnPublish').prop('disabled', false).text('Опубликовать')
      .css({ background: '', borderColor: '', color: '' });
    loadSlots();
  }

  $('#channelSelect').on('change', function () {
    channelId = parseInt(this.value, 10);
    applyState();
  });

  $('#datePicker').on('change', function () {
    if (!this.value) return;
    date = this.value;
    applyState();
  });

  // toISOString() даёт UTC и в восточных таймзонах съезжает на сутки —
  // считаем локально, форматируем вручную.
  function toLocalISODate(d) {
    return d.getFullYear() + '-' +
           pad(d.getMonth() + 1) + '-' +
           pad(d.getDate());
  }
  function shiftDate(dateStr, days) {
    var parts = dateStr.split('-');
    var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10) + days);
    return toLocalISODate(d);
  }

  $('#btnPrev').on('click', function () {
    date = shiftDate(date, -1);
    applyState();
  });

  $('#btnNext').on('click', function () {
    date = shiftDate(date, 1);
    applyState();
  });

  $('#btnToday').on('click', function () {
    date = toLocalISODate(new Date());
    applyState();
  });

  // ──────────────────────────────────────────────────────────────────
  // Удаление слота
  // ──────────────────────────────────────────────────────────────────
  function removeSlot(slotId, $tile) {
    if (!confirm('Удалить слот?')) return;
    $tile.css('opacity', 0.4);
    $.ajax({ url: '/api/schedule/slots/' + slotId, method: 'DELETE' })
      .done(function () {
        $tile.remove();
        $conflict.hide();
        toast('Слот удалён');
      })
      .fail(function (xhr) {
        $tile.css('opacity', 1);
        toast(xhrErr(xhr), 'error');
      });
  }

  // ──────────────────────────────────────────────────────────────────
  // Drag & Drop
  // ──────────────────────────────────────────────────────────────────
  function getDropMinute(clientY) {
    // getBoundingClientRect учитывает scroll — даёт правильную позицию в таймлайне
    var rect = $timeline[0].getBoundingClientRect();
    return (clientY - rect.top) / PX_PER_MIN;
  }

  function snapTo5(min) {
    return Math.round(min / SNAP_MIN) * SNAP_MIN;
  }

  // ──────────────────────────────────────────────────────────────────
  // Native drag handlers — обходим возможные глюки jQuery с HTML5 DnD
  // ──────────────────────────────────────────────────────────────────
  var timelineEl = $timeline[0];

  // dragstart на пуле — фиксируем что тащим
  document.getElementById('programsList').addEventListener('dragstart', function (e) {
    var li = e.target.closest('.program-item');
    if (!li) return;
    dragging = {
      programId: parseInt(li.getAttribute('data-program-id'), 10),
      title:     String(li.getAttribute('data-title') || ''),
      duration:  parseInt(li.getAttribute('data-duration'), 10) || 60,
    };
    li.classList.add('dragging');
    timelineEl.classList.add('gb-drag-active');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy';
      try { e.dataTransfer.setData('text/plain', dragging.title); } catch (_) {}
    }
    console.log('[DragStart]', dragging.title, 'over', timelineEl ? 'found' : 'NOT FOUND');
  });

  document.getElementById('programsList').addEventListener('dragend', function (e) {
    var li = e.target.closest('.program-item');
    if (li) li.classList.remove('dragging');
    $ghost.hide();
    timelineEl.classList.remove('gb-drag-active');
    dragging = null;
  });

  // dragover на таймлайне — preventDefault разрешает drop здесь
  function onTimelineDragOver(e) {
    if (!dragging) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';

    // Разрешаем заходить за полночь — старт ограничен только 0,
    // верхний предел отдан на откуп: «хвост» уйдёт на завтра.
    var snapped = Math.max(0, Math.min(
      TOTAL_MINS - SNAP_MIN,
      snapTo5(getDropMinute(e.clientY))
    ));

    var visEnd = Math.min(TOTAL_MINS, snapped + dragging.duration);
    $ghost.css({
      top:    snapped * PX_PER_MIN + 'px',
      height: Math.max(10, (visEnd - snapped) * PX_PER_MIN) + 'px',
      display: 'flex',
    }).find('.ghost-text').text(
      dragging.title + '  ' + minToStr(snapped) + '–' + minToStr(snapped + dragging.duration) +
      (snapped + dragging.duration > TOTAL_MINS ? '  →след.день' : '')
    );
  }

  timelineEl.addEventListener('dragenter', function (e) {
    if (dragging) e.preventDefault();
  });
  timelineEl.addEventListener('dragover', onTimelineDragOver);

  timelineEl.addEventListener('dragleave', function (e) {
    if (!timelineEl.contains(e.relatedTarget)) $ghost.hide();
  });

  timelineEl.addEventListener('drop', function (e) {
    if (!dragging) return;
    e.preventDefault();
    e.stopPropagation();

    var snapped = Math.max(0, Math.min(
      TOTAL_MINS - SNAP_MIN,
      snapTo5(getDropMinute(e.clientY))
    ));

    $ghost.hide();
    timelineEl.classList.remove('gb-drag-active');

    var d = dragging;
    dragging = null;
    createSlot(d.programId, d.title, d.duration, snapped);
  });

  // Safety net: блокируем дефолтный браузерный drop по document при активном drag.
  // Без этого если событие случайно сбежит из таймлайна — браузер откроет файл/ссылку.
  document.addEventListener('dragover', function (e) {
    if (dragging) e.preventDefault();
  });
  document.addEventListener('drop', function (e) {
    if (dragging) e.preventDefault();
  });

  // ──────────────────────────────────────────────────────────────────
  // Перемещение / изменение размера существующих слотов
  // (mouse-based, чтобы не конфликтовать с native HTML5 DnD на пуле)
  // ──────────────────────────────────────────────────────────────────
  var slotDrag = null;

  $timeline.on('mousedown', '.gb-slot', function (e) {
    if (e.button !== 0) return;
    var $target = $(e.target);
    if ($target.is('.js-del-slot')) return; // клик по «×» — не drag

    var $tile  = $(this);
    var slotId = parseInt($tile.data('slot-id'), 10);
    if (!slotId) return;

    var startsAt0 = $tile.attr('data-starts-at');
    var endsAt0   = $tile.attr('data-ends-at');
    if (!startsAt0 || !endsAt0) return;

    var startMs0 = new Date(startsAt0).getTime();
    var endMs0   = new Date(endsAt0).getTime();
    var dayMs0   = viewDayStartMs();
    var startMin0 = Math.round((startMs0 - dayMs0) / 60000);
    var endMin0   = Math.round((endMs0   - dayMs0) / 60000);

    var mode = 'move';
    if ($target.hasClass('gb-slot-resize-top'))    mode = 'resize-top';
    else if ($target.hasClass('gb-slot-resize-bottom')) mode = 'resize-bottom';

    slotDrag = {
      slotId: slotId,
      $tile: $tile,
      mode: mode,
      pointerY: e.clientY,
      startMin0: startMin0,
      endMin0: endMin0,
      duration: endMin0 - startMin0,
      newStartMin: startMin0,
      newEndMin: endMin0,
      changed: false,
    };
    $tile.addClass('slot-dragging');
    document.body.classList.add('slot-dragging-active');
    e.preventDefault();
  });

  $(document).on('mousemove.gbSlotDrag', function (e) {
    if (!slotDrag) return;
    var deltaMin = snapTo5((e.clientY - slotDrag.pointerY) / PX_PER_MIN);
    if (!deltaMin && !slotDrag.changed) return;

    var ns = slotDrag.startMin0;
    var ne = slotDrag.endMin0;
    if (slotDrag.mode === 'move') {
      ns = slotDrag.startMin0 + deltaMin;
      ne = slotDrag.endMin0   + deltaMin;
    } else if (slotDrag.mode === 'resize-top') {
      ns = Math.min(slotDrag.endMin0 - SNAP_MIN, slotDrag.startMin0 + deltaMin);
    } else if (slotDrag.mode === 'resize-bottom') {
      ne = Math.max(slotDrag.startMin0 + SNAP_MIN, slotDrag.endMin0 + deltaMin);
    }
    slotDrag.newStartMin = ns;
    slotDrag.newEndMin   = ne;
    if (ns !== slotDrag.startMin0 || ne !== slotDrag.endMin0) slotDrag.changed = true;

    var visStart = Math.max(0, ns);
    var visEnd   = Math.min(TOTAL_MINS, ne);
    slotDrag.$tile.css({
      top: visStart * PX_PER_MIN + 'px',
      height: Math.max(PX_PER_MIN * 5, (visEnd - visStart) * PX_PER_MIN) + 'px',
    });
    slotDrag.$tile.toggleClass('cont-prev', ns < 0);
    slotDrag.$tile.toggleClass('cont-next', ne > TOTAL_MINS);
    slotDrag.$tile.find('.gb-slot-time').text(minToStr(ns) + '–' + minToStr(ne));
  });

  $(document).on('mouseup.gbSlotDrag', function () {
    if (!slotDrag) return;
    var d = slotDrag;
    slotDrag = null;
    d.$tile.removeClass('slot-dragging');
    document.body.classList.remove('slot-dragging-active');

    if (!d.changed) return;

    var newStartIso = new Date(viewDayStartMs() + d.newStartMin * 60000).toISOString();
    var newEndIso   = new Date(viewDayStartMs() + d.newEndMin   * 60000).toISOString();

    $.ajax({
      url: '/api/schedule/slots/' + d.slotId,
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify({ startsAt: newStartIso, endsAt: newEndIso }),
    })
    .done(function (resp) {
      $conflict.hide();
      var g = slotGeom(resp.data.starts_at, resp.data.ends_at);
      applyGeom(d.$tile, g);
      toast('Слот обновлён');
    })
    .fail(function (xhr) {
      // Откатываем визуально на исходные значения
      var g = slotGeom(
        new Date(viewDayStartMs() + d.startMin0 * 60000).toISOString(),
        new Date(viewDayStartMs() + d.endMin0   * 60000).toISOString()
      );
      applyGeom(d.$tile, g);
      handleConflict(xhr);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Добавление по клику (форма в левой панели)
  // ──────────────────────────────────────────────────────────────────
  var selected = null;

  $('#programsList').on('click', '.program-item', function () {
    selected = {
      programId: parseInt($(this).data('program-id'), 10),
      title:     String($(this).data('title') || ''),
      duration:  parseInt($(this).data('duration'), 10) || 60,
    };
    $('#programsList .program-item').removeClass('selected');
    $(this).addClass('selected');
    $('#addFormTitle').text(selected.title + '  ·  ' + selected.duration + ' мин');
    $('#addFormStart').val('');
    $('#addFormEnd').val('');
    $('#addForm').show();
    $('#addFormStart').focus();
  });

  $('#addFormStart').on('input change', function () {
    if (!selected || !this.value) { $('#addFormEnd').val(''); return; }
    var parts  = this.value.split(':');
    var startM = parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
    $('#addFormEnd').val(minToStr(startM + selected.duration));
  });

  $('#addFormConfirm').on('click', function () {
    if (!selected) return;
    var val = $('#addFormStart').val();
    if (!val) { toast('Укажите время начала', 'warning'); return; }
    var parts  = val.split(':');
    var startM = parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
    createSlot(selected.programId, selected.title, selected.duration, startM);
    closeAddForm();
  });

  $('#addFormCancel').on('click', closeAddForm);

  function closeAddForm() {
    selected = null;
    $('#addForm').hide();
    $('#programsList .program-item').removeClass('selected');
  }

  // ──────────────────────────────────────────────────────────────────
  // Создание слота
  // ──────────────────────────────────────────────────────────────────
  function createSlot(programId, programTitle, duration, startMin) {
    var startsAt = new Date(date + 'T' + minToStr(startMin) + ':00');
    var endsAt   = new Date(startsAt.getTime() + duration * 60000);
    $conflict.hide();

    $.ajax({
      url:         '/api/schedule/slots',
      method:      'POST',
      contentType: 'application/json',
      data:        JSON.stringify({
        channelId: channelId,
        programId: programId,
        startsAt:  startsAt.toISOString(),
        endsAt:    endsAt.toISOString(),
      }),
    })
    .done(function (resp) {
      renderSlot(resp.data);
      toast('Добавлено: ' + minToStr(startMin) + '–' + minToStr(startMin + duration));
    })
    .fail(function (xhr) {
      handleConflict(xhr);
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // Поиск в пуле передач (live-фильтр, без перезагрузки)
  // ──────────────────────────────────────────────────────────────────
  $('#poolSearch').on('input', function () {
    var q = this.value.toLowerCase().trim();
    $('#programsList .program-item').each(function () {
      // attr() вместо data() — читает атрибут напрямую без кэша jQuery
      var haystack = String($(this).attr('data-search') || '');
      $(this).toggle(!q || haystack.indexOf(q) !== -1);
    });
    // Если выбранный элемент скрылся — убираем форму
    if (selected) {
      var $sel = $('#programsList .program-item.selected');
      if ($sel.length && !$sel.is(':visible')) closeAddForm();
    }
  });

  // ──────────────────────────────────────────────────────────────────
  // Публикация
  // ──────────────────────────────────────────────────────────────────
  $('#btnPublish').on('click', function () {
    if (!confirm('Опубликовать сетку на ' + date + '?')) return;
    var $btn = $(this).prop('disabled', true).text('Публикация…');
    $.ajax({
      url:         '/api/schedule/publish',
      method:      'POST',
      contentType: 'application/json',
      data:        JSON.stringify({ channelId: channelId, date: date }),
    })
    .done(function (r) {
      $timeline.find('.gb-slot').addClass('published');
      toast('Опубликовано: ' + r.data.published + ' слотов');
      $btn.text('Опубликовано ✓')
          .css({ background: 'var(--success)', borderColor: 'var(--success)', color: '#06151A' });
    })
    .fail(function (xhr) {
      toast(xhrErr(xhr), 'error');
      $btn.prop('disabled', false).text('Опубликовать').css({ background: '', borderColor: '', color: '' });
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Обработка конфликта слотов
  // ──────────────────────────────────────────────────────────────────
  function handleConflict(xhr) {
    var body = xhr.responseJSON || {};
    if (body.error === 'SLOT_CONFLICT' && body.conflicts && body.conflicts.length) {
      $conflict.show().text(
        'Конфликт времени — слот не добавлен:\n' +
        body.conflicts.map(function (c) {
          return '  · ' + (c.program_title || '?') + '  ' +
            fmtTime(new Date(c.starts_at)) + '–' + fmtTime(new Date(c.ends_at));
        }).join('\n')
      );
      toast('Конфликт — выберите другое время', 'warning');
    } else {
      toast(xhrErr(xhr), 'error');
    }
  }
})();
