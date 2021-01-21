var base_url = location.href.split("?")[0]
var img_list = [];
var params = {}
var w = null;


$( document ).ready(function() {

    w = new AjaxWindow();
    w.init();

    $('.album-photo-preview').on('click', function(e) {
        e.preventDefault();
        url = $(this).attr('href');
        load_photo_frame(url);
    })

    window.onpopstate =  function(e) {
        e.preventDefault()
        if ($('#ajax-content').length) {
            w.remove_ajax_window();
        } else {
            window.history.back();
        }
    }

    $(document).find('.album-photo-preview').each(function() {
        img_list.push($(this).data('id'));
    })
    parse_url();

    if ('show' in params) {
        load_photo_frame('show/'+ params['show'])
    }
})

function load_photo_frame(url) {

    $.get(url).done(function(data) {
        p_id = url.split('?')[0].split('/');
        p_id = p_id[p_id.length - 1];
        change_url(p_id);
        w.build(data, p_id);
    });
}

function AjaxWindow() {

    this.header_size = 70;

    // ID показываемого изображения
    this.id = undefined;

    // true если в данный момент идёт загрузка
    this.loading = false;

    // Срабатывает сразу вместе с инициализацией
    // AjaxWindow после загрузки страницы с галереей
    this.init = function() {

        var _this = this;
        document.addEventListener('keydown', function(event) {
            if ($('#ajax-content').length == 0) {
                return
            }
            if (event.keyCode == 27) {
                _this.remove_ajax_window()
            }

            if (event.keyCode == 37) {
                _this._load_previous();
            }

            if (event.keyCode == 39) {
                _this._load_next();
            }
        })

        jQuery('body').swipe({
            swipe:function(event, direction, distance, duration, fingerCount, fingerData) {
                if ($('#ajax-content').length == 0) {
                    return
                }
                if (direction == 'left') {
                    return _this._load_previous();
                }
                if (direction == 'right') {
                    return _this._load_next();
                }
            }
        });
    }

    this.build = function(data, p_id) {

        var _this = this;

        this.id = parseInt(p_id);

        if ($('#ajax-content').length) {
            w.update(data, p_id);
        } else {
            w.create_new(data, p_id)
        }


    }

    this.create_new = function(data) {

        $('<div>', {
            'id': 'ajax-content',
            'class': 'ajax-content-window img-slider',
            'html': data
        }).appendTo('#content-wrapper');

        this.bind_events();
    }

    this.update = function(data) {

        var f = $('#popup-img-frame');

        if (f.length != 0) {
            var h = f.find('img').eq(0).height() + 'px';
        } else {
            var h = 'auto'
        }

        $('#ajax-content').html(data);

        f = $('#popup-img-frame');
        f.css({'height': h});
        f.find('img').eq(0).on('load', function() {
            f.css({'height': 'auto'})
        })

        this.bind_events();

    }

    this.bind_events = function() {
        var _this = this;

        if (img_list.indexOf(this.id) >= img_list.length - 1) {
            $('#toggle-photo-next').toggleClass('disabled-button')
        }
        if (img_list.indexOf(this.id) == 0) {
            $('#toggle-photo-previous').toggleClass('disabled-button')
        }

        $('#go-back-link').on('click', function(e) {
            e.preventDefault();
            _this.remove_ajax_window()
        })

        // закрытие окна при клике за его пределами
        $('#ajax-content').on('click', function(e) {
            if (e.target == this) {
                _this.remove_ajax_window()
            }
        })

        $('#close-window-button').on('click', function(e) {
            e.preventDefault();
            _this.remove_ajax_window()
        })

        $('#toggle-photo-next').on('click', function() {
            if (_this.loading == false) {
                _this._load_next();
            };
        })

        $('#toggle-photo-previous').on('click', function() {
            if (_this.loading == false) {
                _this._load_previous();
            };
        })
    }

    this._load_previous = function() {
        var i = img_list.indexOf(this.id);

        if (i == 0) return;
        var url = 'get_photo_context/' + img_list[i-1];

        this._get_new_context(url)
    }

    this._load_next = function() {

        var i = img_list.indexOf(this.id);
        if (i == img_list.length - 1) return;
        var url = 'get_photo_context/' + img_list[i+1]

        this._get_new_context(url)
    }

    // Получает JSON с данными следующего изображения
    // и вносит данные в соответсвующие элементы
    this._get_new_context = function(url) {

        var _this = this;
        this.loading = true;
        $.get(url)
            .done(function(data) {
                _this.id = data['id'];
                console.log('done')
                $('#photo-year').html(data['year'] == null ? '' : data['year'])
                $('#photo-decade').html(data['decade'] == null ? '' : data['decade'] + '-ые')
                $('#photo-uploader').html(data['uploader'] == null ? '' : data['uploader'])
                $('#photo-uploaded').html(data['uploaded'] == null ? '' : data['uploaded'])
                $('#photo-author').html(data['author'] == null ? '' : data['author'])
                $('#photo-source').html(data['source'] == null ? '' : data['source'])
                $('#photo-img').attr('src', data['url_large']).attr('alt', data['alt'])

                $('#photo-edit-link').attr('href', '/mmz/edit_photo/' + data['id'])
            })
            .always(function() {
                _this.loading = false;
            });
    }

    this.remove_ajax_window = function() {
        $('#ajax-content').remove();
        change_url(null)
    }
}



function change_url(p_id) {

    if (p_id == null) {
        delete params['show']
    } else {
        params['show'] = p_id;
    }

    var p_arr = []
    for (var key in params) {
        p_arr.push(key + '=' + params[key])
    }
    if (p_arr.length > 0) {
        var url = base_url + '?' + p_arr.join('&');
    } else {
        var url = base_url;
    }


    window.history.pushState( {} , '', url );
};

function parse_url() {
    var url = location.href.split("?")

    if (url.length > 1) {
        $.each(url[1].split('&'), function(i, p) {
            p = p.split('=');
            params[p[0]] = p[1]
        })
    }
}
