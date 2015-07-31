$(document).ready(function() {
  $(document).on('keyup input', '#searchBox', function() {
    if ($(this).val()) {
      $(this).next('.clear-search').show();
    } else {
      $(this).next('.clear-search').hide();
    }
  });
  $(document).on('click', '.clear-search', function(){
    $(this).prev('input').val('');
    $(this).hide();
  });
});