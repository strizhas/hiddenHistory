
var base_url = location.href.split('?')[0];
var w = null;
$( document ).ready(function() {

    $('.album-photo-preview').on('click', function(e) {
        e.preventDefault();
        url = $(this).attr('href')

        p_id = url.split('?')[0].split('/')
        p_id = p_id[p_id.length - 1]
        change_url(p_id)


        $.get(url).done(function(data) {
            w = new AjaxWindow()
            w.build(data)
        });
    })

    window.onpopstate =  function(e) {
        e.preventDefault()
        if ($('#ajax-content').length) {
            w.remove_ajax_window()
        } else {
            window.history.back()
        }
    }
})

function AjaxWindow() {

    this.header_size = 70;
    this.build = function(data) {

        $('<div>', {
            'id': 'ajax-content',
            'class': 'ajax-content-window',
            'html': data
        }).appendTo('#content-wrapper')


        this.bind_events()

    }
    this.bind_events = function() {
        var _this = this
        $('#go-back-link').on('click', function(e) {
            e.preventDefault();
            _this.remove_ajax_window()
        })

        $('#close-window-button').on('click', function(e) {
            e.preventDefault();
            _this.remove_ajax_window()
        })
    }

    this.remove_ajax_window = function() {
        $('#ajax-content').remove();
        window.history.pushState( {} , '', base_url );
    }
}



function change_url(p_id) {
    var url = base_url + `?show=${p_id}`;
    window.history.pushState( {} , '', url );
};
