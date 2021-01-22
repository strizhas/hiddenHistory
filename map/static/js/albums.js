var base_url = location.href.split("?")[0]
var img_list = [];
var params = {}
var w = null;


$( document ).ready(function() {

    w = new AjaxWindow();
    w.init();

    $('.album-photo-preview').on('click', function(e) {
        e.preventDefault();
        w.build($(this).attr('href'));
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
        w.build('show/'+ params['show']);
    }
})


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
                if ($('#ajax-content').length == 0 || distance < 60) {
                    return
                }

                if (direction == 'left') {
                    return _this._load_next();
                }
                if (direction == 'right') {
                    return _this._load_previous();
                }
            }
        });
    }

    this.build = function(url) {

        var _this = this;
        var wrapper = $('<div>', {
                'id': 'ajax-content',
                'class': 'ajax-content-window img-slider'
                }).appendTo('#content-wrapper');

        $('<div>', {
                'class': 'throbber-loader loader-icon'
                }).appendTo(wrapper);

        p_id = url.split('?')[0].split('/');
        p_id = p_id[p_id.length - 1];

        this._change_url(p_id);
        this.id = parseInt(p_id);

        $.get(url).done(function(data) {
            wrapper.html(data);
            _this.bind_events();
        });

    }

    this.remove_ajax_window = function() {
        $('#ajax-content').remove();
        this._change_url(null)
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

        // В случае, если текущая фотография первая - выходим
        // Если вторая - то убираем кнопку "предыдущая"
        if (i == 0) return;
        if (i == 1) {
            $('#toggle-photo-previous').addClass('disabled-button')
        }
        var url = 'get_photo_context/' + img_list[i-1];

        this._get_new_context(url);
        $('#toggle-photo-next').removeClass('disabled-button')
    }

    this._load_next = function() {
        var i = img_list.indexOf(this.id);

        // В случае, если текущая фотография последняя - выходим
        // Если предпоследняя - то убираем кнопку "следующая"
        if (i == img_list.length - 1) return;
        if (i == img_list.length - 2) {
            $('#toggle-photo-next').addClass('disabled-button')
        }
        var url = 'get_photo_context/' + img_list[i+1]

        this._get_new_context(url);
        $('#toggle-photo-previous').removeClass('disabled-button')
    }

    // Получает JSON с данными следующего изображения
    // и вносит данные в соответсвующие элементы
    this._get_new_context = function(url) {

        var loader;
        var _this = this;
        this.loading = true;

        var img = $('#photo-img');

        // Через 200 миллисекунд добавляем значок
        // загрузки на картинку. Делаем для пользователей
        // с медленным интернетом (типа меня) чтобы показать,
        // что загрузка идёт. Задержка - чтобы не возникало
        // мерцания, если интернет норм
        var timer = setTimeout(function() {
            img.addClass('img-toggling');
            loader = $('<div>', {
                'class': 'throbber-loader loader-icon'
            }).appendTo($('#photo-img-inner'));
        }, 200);

        var image_onload = function(new_img, data) {
            $('#photo-year').html(data['year'] == null ? '' : data['year'] + ',');
            $('#photo-decade').html(data['decade'] == null ? '' : data['decade'] + '-ые');
            $('#photo-uploader').html(data['uploader'] == null ? '' : data['uploader']);
            $('#photo-uploaded').html(data['uploaded'] == null ? '' : data['uploaded']);
            $('#photo-author').html(data['author'] == null ? '' : data['author']);
            $('#photo-source').html(data['source'] == null ? '' : data['source']);
            $('#photo-edit-link').attr('href', '/mmz/edit_photo/' + data['id']);

            $(new_img).attr('id', 'photo-img');
            $(new_img).attr('alt', data['alt']);
            $('#photo-img-inner').html(new_img);

            //img.attr('src', data['url_large']).attr('alt', data['alt']);
            _this._change_url(data['id']);
            _this.loading = false;
        }

        $.get(url)
            .done(function(data) {
                var new_img = new Image();
                new_img.onload = function() {
                    image_onload(new_img, data)
                };
                new_img.src = data['url_large'];
                _this.id = data['id'];
            })
            .fail(function() {
                _this.loading = false;
                clearTimeout(timer);
                img.removeClass('img-toggling');
                if (loader != undefined) {
                    loader.remove();
                }
            })
            .always(function() {
                clearTimeout(timer);
            });
    }


    this._change_url = function(p_id) {

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
}





function parse_url() {
    var url = location.href.split("?")

    if (url.length > 1) {
        $.each(url[1].split('&'), function(i, p) {
            p = p.split('=');
            params[p[0]] = p[1]
        })
    }
}
