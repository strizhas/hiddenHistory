

var loaded = {}
var loaded_preview = {}
var cursor_on = undefined;
var cursor_timer = undefined;
var marker_layers = {};
var year_min = undefined;
var year_max = undefined;
var tooltip = undefined;
var map = undefined;
var basemaps = undefined;
var base_url = location.href.split('?')[0]

const _setPosOriginal = L.Marker.prototype._setPos;

L.Marker.addInitHook(function() {
    const anchor = this.options.icon.options.iconAnchor

    if (anchor != undefined) {
        this.options.rotationOrigin = anchor[0] + 'px ' + anchor[1] + 'px'
    } else {
        this.options.rotationOrigin = 'center center'
    }

    // Ensure marker remains rotated during dragging.
    this.on('drag', function(data) {this._rotate()})
})

L.Marker.include({
    _setPos: function(pos) {
      _setPosOriginal.call(this, pos)
      if (this.options.rotation) this._rotate()
    },
    _rotate: function() {
      this._icon.style[L.DomUtil.TRANSFORM + 'Origin'] = this.options.rotationOrigin
      this._icon.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.rotation + 'deg)'
    }
});

function markerOptions(size, rotation, data) {
  const iconOptions = {
    iconSize  : [size, size],
    iconAnchor: [size/2, size/2],
    tooltipAnchor: [ -5, -10 ],
    className : 'mymarker',
    id        : data['id'],
    year      : data['year'],
    html      : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="2.73" cy="5" r="2.23" fill="#e3e3e3" stroke="#383023" stroke-miterlimit="10"/><polygon points="4.09 3.13 1.37 3.13 2.73 0 4.09 3.13" fill="#383023"/></svg>'
  }
  return {
    draggable: false,
    icon: L.divIcon(iconOptions),
    rotation: 360 - rotation
  }
};

function request_single_photo(e) {
    var popup = e.target.getPopup();
    var marker_id = e.target.options.icon.options.id

    if (marker_id in loaded) {
        return;
    }
    var url="/mmz/get_photo?id=" + marker_id;

    $.get(url).done(function(data) {
        popup.setContent(data);
        popup.update();
        loaded[marker_id] = true;
    });
};

function request_preview(e, m) {
    var marker_id = e.target.options.icon.options.id;

    if (marker_id in loaded_preview) {
        return;
    }

    m.bindTooltip("<div class='img-blank'></div>", {
                            'direction': 'top',
                            'opacity': 1
                            });
    var t = m.getTooltip();
    var url="/mmz/get_preview?id=" + marker_id;

    m.openTooltip();
    $.get(url).done(function(data) {
        var img = $('<img>', {
            'src': data.url
        })
        t.setContent(img[0]);
        t.update();
        loaded_preview[marker_id] = true;
    });
}

function draw_markers(response) {

    for (var decade in response.data) {
        var group = [];
        $.each(response.data[decade], function() {
            var opts = markerOptions(20, this.direction, {"id": this.id, "year": this.year})
            var m = L.marker([this.latitude, this.longitude], opts)

                m.bindPopup("загрузка...");
                m.on("click", function(e) {
                    request_single_photo(e);
                });
                m.on("mouseover", function(e) {
                    var m_id =  e.target.options.icon.options.id;
                    var m = this;
                    cursor_on = m_id;
                    cursor_timer = setTimeout(function() {
                        if (cursor_on == m_id) {
                            request_preview(e, m);
                        }
                    }, 300)
                });
                m.on("mouseout", function(e) {
                    cursor_on = undefined;
                    var t = this.getTooltip();
                    if (t != undefined) {
                        t.closeTooltip()
                    }
                });
            group.push(m);
        })
        if (decade != 'null') {
            var layer_name = decade ;
        } else {
            var layer_name = 'неизвестно';
        }
        marker_layers[layer_name] = L.layerGroup(group).addTo(map);
    }
    //L.control.layers(basemaps, marker_layers).addTo(map);
    L.control.layers(basemaps).addTo(map);
};


function build_slider(years, data) {

    var decades = Object.keys(data)
    var i = decades.indexOf('null')

    if (i != -1) {
        decades.splice(i, 1)
    }

    decades = decades.map(parseFloat).sort()

    if (years[0] < decades[0]) {
        year_min = years[0];
    } else {
        year_min = decades[0]
    }

    year_max = years[years.length - 1];

    $('<input>', {
        'name': 'min',
        'type': 'range',
        'min': year_min,
        'max': year_max,
        'step': 1,
        'value': year_min,
        'id': 'jsr-1-1'
    }).appendTo('#time-range-slider')

    $('<input>', {
        'name': 'max',
        'type': 'range',
        'min': year_min,
        'max': year_max,
        'step': 1,
        'value': year_max,
        'id': 'jsr-1-2'
    }).appendTo('#time-range-slider')

    const range = new JSR(['#jsr-1-1', '#jsr-1-2'], {
        min: year_min,
        max: year_max,
        sliders: 2,
        values: [year_min, year_max]
    });

    range.addEventListener('update', function(input, value) {
        var name = $(input).attr('name');

        if (name == "min") {
            year_min = value;
        } else {
            year_max = value;
        }

        var d0 = Math.floor(year_min/10)*10;
        var d1 = Math.floor(year_max/10)*10;

        for (var layer in marker_layers) {
            l_int = parseInt(layer)
            if (l_int < d0 || l_int > d1) {
                if(map.hasLayer(marker_layers[layer])) {
                    map.removeLayer(marker_layers[layer]);
                }
                continue
            }
            if (!(map.hasLayer(marker_layers[layer]))) {
                map.addLayer(marker_layers[layer]);
            }
        }

        if (d1.toString() in marker_layers) {
            var markers_d1 = marker_layers[d1.toString()].getLayers();

            for (var i=0; i<markers_d1.length; i++) {
                var m = markers_d1[i];
                if (m.options.icon.options.year >= year_min &&
                    m.options.icon.options.year <= year_max) {
                    m._icon.style.display = 'block'
                } else {
                    m._icon.style.display = 'none'
                }
            }

            if (d0 == d1) return;
        }

        if (d0.toString() in marker_layers) {
            var markers_d0 = marker_layers[d0.toString()].getLayers();

            for (var i=0; i<markers_d0.length; i++) {
                var m = markers_d0[i];

                if (m.options.icon.options.year == null) {
                    continue;
                }
                if (m.options.icon.options.year >= year_min &&
                    m.options.icon.options.year <= year_max) {
                    m._icon.style.display = 'block'
                } else {
                    m._icon.style.display = 'none'
                }
            }
        }
    });
};

function request_photos() {
    $.ajax({
        url : "/mmz/get_photos_data",
        type : "GET",
        success : function(response) {
            draw_markers(response);
            build_slider(response.years, response.data);
        },
        error : function(xhr,errmsg,err) {
        },
        complete: function() {
        }
    });
};

function get_map_params() {

    var center = [55.7507898, 37.6946124];
    var zoom = 15;
    var params = {};

    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
      params[key] = value;
    });

    if ('center' in params) {
        center = params.center.split(",").map(parseFloat);
    }

    if ('zoom' in params) {
        zoom = parseInt(params.zoom)
    }

    return {
        'center': center,
        'zoom': zoom
    }
};

function change_url(center, zoom) {
    var url = base_url + '?center=' + center.lat + ',' + center.lng;
        url += '&zoom=' + zoom;

    window.history.replaceState( {} , '', url );
};

function init_map() {
    var corner1 = L.latLng(55.765,37.671);
    var corner2 = L.latLng(55.74,37.72);
    var bounds = L.latLngBounds(corner1, corner2);

    var tile_urls = {
        'ge-2010': 'https://storage.yandexcloud.net/hh-files/tilesets/ge-2010/{z}/{x}/{y}.png',
        // '1906': 'https://storage.yandexcloud.net/hh-files/tileset-1906/{z}/{x}/{y}.png',
        'osm': 'http://{s}.tile.osm.org/{z}/{x}/{y}.png'
    };

    var basemap_ge_2010 = L.tileLayer(tile_urls['ge-2010'], {
        id: 'basemap-ge-2010',
        maxZoom: 20
        });
    var basemap_1906 = L.tileLayer(tile_urls['1906'], {
        id: 'basemap-1906',
        maxNativeZoom: 17,
        maxZoom: 18
        });
    var basemap_osm = L.tileLayer(tile_urls['osm'], {
        id: 'basemap-osm',
        maxZoom: 20
        });

    basemaps = {
        'спутниковый снимок 2010 года': basemap_ge_2010,
        'карта OSM': basemap_osm
    };
    var params = get_map_params()

    map = L.map('map', {
        center: params.center,
        zoom: params.zoom,
        zooms: [15,16,17,18,19,20],
        minZoom: 15,
        layers: [basemap_ge_2010]
    });

    //map.fitBounds(bounds);
    map.setMaxBounds(bounds);

    request_photos();

    map.on('moveend', function() {
        center = map.getCenter()
        zoom = map.getZoom()
        change_url(center, zoom)
    })
    map.on('zoomend', function() {
        center = map.getCenter()
        zoom = map.getZoom()
        change_url(center, zoom)
    })
};

init_map()