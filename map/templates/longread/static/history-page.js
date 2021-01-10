window['run_scrips'] = function() {
    var frame = document.getElementById('header-img-frame');
    var new_images = [];
    var n = 0;
    var urls = [
        'https://storage.yandexcloud.net/hh-files/history/photo/cover-slider/rodchenko-1931.jpg',
        'https://storage.yandexcloud.net/hh-files/history/photo/cover-slider/pic_1980s_6efbeed1b8a24e67.jpeg',
        'https://storage.yandexcloud.net/hh-files/history/photo/cover-slider/pano_v2_x4_toned.jpg',
        'https://storage.yandexcloud.net/hh-files/history/photo/cover-slider/simvol.jpg'
    ];
    if (frame == undefined) {
        return;
    }

    function load_next() {
        // Поочередно с заданным интервало загружает
        // изображения из массива urls. После того,
        // как все изображения загружены, вызывает
        // функцию image_toggle()
        setTimeout(function() {
            var img = document.createElement('img')
            img.setAttribute('src', urls[n]);
            img.setAttribute('class', 'img-hidden');
            frame.appendChild(img);
            new_images.push(img);

            img.addEventListener('load', function() {
                img.setAttribute('class', 'img-visible');

            });

            n += 1;
            if (n < urls.length) {
                load_next();
            } else {
                setTimeout(image_toggle, 2000)
            }
        }, 5000);
    };
    // После того, как все изображения загружены
    // функция начинает по очереди их показывать.
    // В общем обычная галерея с автосменой картинок
    function image_toggle() {
        console.log('image_toggle')
        setInterval(function() {
            if (n >= new_images.length) {
                for (var i = 0; i < new_images.length; i++) {
                    new_images[i].setAttribute('class', 'img-hidden');
                }
                n = 0;
                return;
            } else {
                new_images[n].setAttribute('class', 'img-visible');
                n += 1;
            }

        }, 3000)

    }
    load_next();
}
