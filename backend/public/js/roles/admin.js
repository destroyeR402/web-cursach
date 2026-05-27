/* eslint-env browser, jquery */
$(function () {
  'use strict';

  // === Фильтр + пагинация пользователей ===
  var PAGE_SIZE = 20;
  var currentPage = 1;
  var filterQ = '';

  function allRows() { return $('#usersTbody tr'); }
  function filteredRows() {
    return allRows().filter(function () {
      return !filterQ || ($(this).data('search') || '').indexOf(filterQ) !== -1;
    });
  }

  function renderPage() {
    var $rows  = filteredRows();
    var total  = $rows.length;
    var pages  = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > pages) currentPage = pages;

    allRows().hide();
    $rows.each(function (i) {
      if (i >= (currentPage - 1) * PAGE_SIZE && i < currentPage * PAGE_SIZE) $(this).show();
    });

    var $pag = $('#usersPagination').empty();
    if (pages <= 1) { $pag.append('<span class="page-info">' + total + ' пользователей</span>'); return; }
    $pag.append('<span class="page-info">' + total + ' пользователей</span>');
    $('<button class="btn btn-sm">‹</button>').prop('disabled', currentPage === 1)
      .on('click', function () { currentPage--; renderPage(); }).appendTo($pag);
    for (var p = 1; p <= pages; p++) {
      $('<button class="btn btn-sm' + (p === currentPage ? ' active' : '') + '">' + p + '</button>')
        .data('p', p).on('click', function () { currentPage = $(this).data('p'); renderPage(); }).appendTo($pag);
    }
    $('<button class="btn btn-sm">›</button>').prop('disabled', currentPage === pages)
      .on('click', function () { currentPage++; renderPage(); }).appendTo($pag);
  }

  renderPage();

  $('#userSearch').on('input', function () {
    filterQ = this.value.toLowerCase().trim();
    currentPage = 1;
    renderPage();
  });

  // === Смена роли — требует reload (меняется UI строки) ===
  $(document).on('change', '.js-role', function () {
    var $sel  = $(this);
    var id    = $sel.data('id');
    var role  = $sel.val();
    var prev  = $sel.data('prev') || $sel.find('option[selected]').val();
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
      // Показываем/скрываем выпадашку редактора в этой же строке
      var $assign = $sel.closest('tr').find('.js-assign');
      if (role === 'editor') {
        if (!$assign.length) location.reload(); // если select не существует — нужен reload
      } else {
        $assign.closest('td').html('');
      }
    }).fail(function (xhr) {
      $sel.val(prev);
      toast(xhrErr(xhr), 'error');
    }).always(function () {
      $sel.prop('disabled', false);
    });
  });

  // === Активность — без reload ===
  $(document).on('change', '.js-active', function () {
    var $cb     = $(this);
    var id      = $cb.data('id');
    var isActive = $cb.is(':checked');
    $cb.prop('disabled', true);

    $.ajax({
      url: '/admin/api/users/' + id + '/active',
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify({ isActive: isActive }),
    }).done(function () {
      toast('Пользователь #' + id + ' ' + (isActive ? 'активирован' : 'деактивирован'));
    }).fail(function (xhr) {
      $cb.prop('checked', !isActive);
      toast(xhrErr(xhr), 'error');
    }).always(function () {
      $cb.prop('disabled', false);
    });
  });

  // === Закрепление редактора за каналом ===
  $(document).on('change', '.js-assign', function () {
    var $sel    = $(this);
    var userId  = $sel.data('user-id');
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
});
