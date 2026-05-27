/* eslint-env browser, jquery */
/**
 * Единый клиентский обработчик кнопок избранного.
 * Использует event delegation на document — работает на любых страницах,
 * включая динамически добавленные кнопки.
 *
 * HTML-контракт:
 *   <button class="btn-fav" data-type="channel|program" data-id="X" data-active="0|1"> ... </button>
 *
 *   При активном состоянии:
 *     - класс .is-fav
 *     - data-active="1"
 *     - текст с символом ★ или ♥
 *   При неактивном:
 *     - без .is-fav
 *     - data-active="0"
 *     - текст с символом ☆ или ♡
 */
(function () {
  // Кэш состояний за сессию страницы, чтобы избежать гонок
  const state = new Map(); // key = `${type}:${id}` → boolean

  function key(type, id) { return type + ':' + id; }

  function setVisualState($btn, isActive) {
    const type = $btn.attr('data-type');
    $btn.attr('data-active', isActive ? '1' : '0');
    $btn.data('active', isActive ? 1 : 0);
    $btn.toggleClass('is-fav', isActive);
    const labels = $btn.data('labels');  // опционально, можно указать кастомные
    if ($btn.hasClass('btn-fav-mini')) {
      $btn.html(isActive ? '♥' : '♡');
    } else if ($btn.hasClass('btn-fav-card')) {
      $btn.html(isActive ? '♥ В избранном' : '♡ В избранное');
    } else {
      // default
      $btn.html(isActive ? '★ В избранном' : '☆ В избранное');
    }
  }

  $(document).on('click', '.btn-fav, .btn-fav-mini, .btn-fav-card', function (e) {
    e.preventDefault();
    e.stopPropagation();  // важно: чтобы клик на <summary> не сворачивал/разворачивал details
    const $btn = $(this);
    const type = $btn.attr('data-type');
    const id = parseInt($btn.attr('data-id'), 10);
    if (!type || !id) return;

    // текущее состояние — берём из кэша, иначе из атрибута
    let currentActive = state.has(key(type, id))
      ? state.get(key(type, id))
      : ($btn.attr('data-active') === '1');

    // Блокируем повторные клики
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    if (currentActive) {
      // удаляем
      $.ajax({
        url: '/client/api/favorites/' + encodeURIComponent(type) + '/' + id,
        method: 'DELETE',
      }).done(function () {
        state.set(key(type, id), false);
        // обновляем все кнопки с тем же type+id на странице
        $('.btn-fav,.btn-fav-mini,.btn-fav-card').each(function () {
          if ($(this).attr('data-type') === type && parseInt($(this).attr('data-id'), 10) === id) {
            setVisualState($(this), false);
          }
        });
      }).fail(handleFail).always(() => $btn.prop('disabled', false));
    } else {
      // добавляем
      $.ajax({
        url: '/client/api/favorites',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ type, targetId: id }),
      }).done(function () {
        state.set(key(type, id), true);
        $('.btn-fav,.btn-fav-mini,.btn-fav-card').each(function () {
          if ($(this).attr('data-type') === type && parseInt($(this).attr('data-id'), 10) === id) {
            setVisualState($(this), true);
          }
        });
      }).fail(handleFail).always(() => $btn.prop('disabled', false));
    }
  });

  function handleFail(xhr) {
    if (xhr.status === 401) {
      if (confirm('Чтобы добавить в избранное — войдите в аккаунт. Перейти на страницу входа?')) {
        window.location = '/auth/login?next=' + encodeURIComponent(window.location.pathname);
      }
      return;
    }
    alert('Ошибка: ' + (xhr.responseJSON?.message || xhr.statusText || 'не удалось обновить избранное'));
  }
})();
