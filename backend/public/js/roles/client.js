/* eslint-env browser, jquery */
$(function () {
  $('.btn-fav').on('click', function () {
    const $b = $(this);
    const type = $b.data('type'), id = $b.data('id'), active = $b.data('active') === '1' || $b.data('active') === 1;
    if (active) {
      $.ajax({ url: `/client/api/favorites/${type}/${id}`, method: 'DELETE' })
        .done(() => { $b.text('☆ В избранное').data('active', '0'); });
    } else {
      $.ajax({
        url: '/client/api/favorites', method: 'POST', contentType: 'application/json',
        data: JSON.stringify({ type, targetId: id }),
      }).done(() => { $b.text('★ В избранном').data('active', '1'); });
    }
  });

  // Перезагрузка персональных слотов (если на странице есть #personalSlots)
  function loadPersonalized() {
    if (!$('#personalSlots').length) return;
    $.get('/client/api/favorites?type=channel').done(function (resp) {
      // (упрощённо: на dashboard сервер уже фильтрует слоты)
    });
  }
  loadPersonalized();
});
