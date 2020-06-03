

(function() {
  // Save original method before overwriting it below.
      const _setPosOriginal = L.Marker.prototype._setPos

      L.Marker.addInitHook(function() {
        const anchor = this.options.icon.options.iconAnchor
        this.options.rotationOrigin = anchor ? `${anchor[0]}px ${anchor[1]}px` : 'center center'
        // Ensure marker remains rotated during dragging.
        this.on('drag', data => { this._rotate() })
      })

      L.Marker.include({
        _setPos: function(pos) {
          _setPosOriginal.call(this, pos)
          if (this.options.rotation) this._rotate()
        },
        _rotate: function() {
          this._icon.style[`${L.DomUtil.TRANSFORM}Origin`] = this.options.rotationOrigin
          this._icon.style[L.DomUtil.TRANSFORM] += ` rotate(${this.options.rotation}deg)`
        }
      })
    })()

var loaded = {}
var loaded_preview = {}

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
}

function request_single_photo(e) {
    var popup = e.target.getPopup();
    var marker_id = e.target.options.icon.options.id

    if (marker_id in loaded) {
        return;
    }
    var url="/get_photo?id=" + marker_id;

    $.get(url).done(function(data) {
        popup.setContent(data);
        popup.update();
        loaded[marker_id] = true;
    });
}

function request_preview(e) {
    var t = e.target.getTooltip();
    var marker_id = e.target.options.icon.options.id;

    if (marker_id in loaded_preview) {
        return;
    }
    var url="/get_preview?id=" + marker_id;

    $.get(url).done(function(data) {
        var img = $('<img>', {
            'src': data.url
        })
        t.setContent(img[0]);
        t.update();
        loaded_preview[marker_id] = true;
    });
}

function request_photos() {
    $.ajax({
        url : "/get_photos_data",
        type : "GET",
        success : function(response) {
            var marker_layers = {}
            for (var decade in response.data) {
                var group = []
                $.each(response.data[decade], function() {
                    var opts = markerOptions(20, this.direction, {"id": this.id, "year": this.year})
                    var m = L.marker([this.latitude, this.longitude], opts)
                        m.bindPopup("загрузка...")
                        m.bindTooltip("<div class='img-blank'>g</div>", {
                            'direction': 'top',
                            'opacity': 1
                            });
                        m.on("click", function(e) {
                            request_single_photo(e)
                        })
                        m.on("mouseover", function(e) {
                            request_preview(e)
                        })
                    group.push(m)
                })
                if (decade != 'null') {
                    var layer_name = decade + '-ые'
                } else {
                    var layer_name = 'неизвестно'
                }
                marker_layers[layer_name] = L.layerGroup(group).addTo(map);
            }
            L.control.layers(basemaps, marker_layers).addTo(map);
        },
        error : function(xhr,errmsg,err) {
        },
        complete: function() {
        }
    });
}

var corner1 = L.latLng(55.76,37.675)
var corner2 = L.latLng(55.742,37.716)
var bounds = L.latLngBounds(corner1, corner2);
var layer = undefined;

var tile_urls = {
    'custom': 'https://storage.yandexcloud.net/hh-files/tileset-custom/{z}/{x}/{y}.png',
    'ge-2010': 'https://storage.yandexcloud.net/hh-files/tileset-ge-2010/{z}/{x}/{y}.png',
    'osm': 'http://{s}.tile.osm.org/{z}/{x}/{y}.png'
}

var basemap_custom = L.tileLayer(tile_urls['custom'], {id: 'MapID', maxZoom: 19});
var basemap_ge_2010 = L.tileLayer(tile_urls['ge-2010'], {id: 'MapID', maxZoom: 19});

var basemaps = {
    'схема завода': basemap_custom,
    'спутниковый снимок 2010 года': basemap_ge_2010
}

var map = L.map('map', {
    center: [55.7507898, 37.6946124],
    zoom: 15,
    minZoom: 15,
    maxZoom: 19,
    layers: [basemap_custom]
});

map.fitBounds(bounds);
map.setMaxBounds(bounds);

request_photos();
