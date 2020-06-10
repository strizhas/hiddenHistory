
var base_url = location.href.split('?')[0];

$( document ).ready(function() {

    $('.album-photo-preview').on('click', function(e) {
        e.preventDefault();
        url = $(this).attr('href')

        p_id = url.split('?')[0].split('/')
        p_id = p_id[p_id.length - 1]
        change_url(p_id)

        $.get(url).done(function(data) {
            $('<div>', {
                'id': 'ajax-content',
                'class': 'ajax-content-window',
                'html': data
            }).appendTo('#content-wrapper')


            $('#go-back-link').on('click', function(e) {
                e.preventDefault();
                remove_ajax_window()
            })
        });
    })

    window.onpopstate =  function(e) {
        e.preventDefault()
        if ($('#ajax-content').length) {
            remove_ajax_window()
        } else {
            window.history.back()
        }
    }
})

function remove_ajax_window() {
    $('#ajax-content').remove();
    window.history.pushState( {} , '', base_url );
}

function change_url(p_id) {
    var url = base_url + `?show=${p_id}`;
    window.history.pushState( {} , '', url );
};
