

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

function markerOptions(size, rotation, data) {
  const iconOptions = {
    iconSize  : [size, size],
    iconAnchor: [size/2, size/2],
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

function request_photos() {
    $.ajax({
        url : "/get_photos_data",
        type : "GET",
        success : function(response) {
            $.each(response.data, function() {
                var opts = markerOptions(20, this.direction, {"id": this.id, "year": this.year})
                var m = L.marker([this.latitude, this.longitude], opts).addTo(map)
                m.bindPopup("загрузка...")
                m.on("click", function(e) {
                    request_single_photo(e)
                })
            })
        },
        error : function(xhr,errmsg,err) {
        },
        complete: function() {
        }
    });
}

function load_layer(url) {

    url += '{z}/{x}/{y}.png';

    if (layer != undefined) {
        map.removeLayer(layer);
    }

    layer = L.tileLayer(url,{
        maxZoom: 19,
    }).addTo(map);
}

var corner1 = L.latLng(55.76,37.675)
var corner2 = L.latLng(55.742,37.716)
var bounds = L.latLngBounds(corner1, corner2);
var layer = undefined;
var tile_servers = {
    'custom': 'https://hh-files.s3.eu-central-1.amazonaws.com/tileset/',
    'osm': 'http://{s}.tile.osm.org/'
}

var map = L.map('map', {
    center: [55.7507898, 37.6946124],
    zoom: 15,
    minZoom: 15,
    maxZoom: 19
});

map.fitBounds(bounds)
console.log(map.getBounds())
map.setMaxBounds(bounds);

load_layer(tile_servers['custom'])
request_photos()

document
    .querySelector('#basemaps')
    .addEventListener('change', function (e) {
      var map_type = e.target.value;
      load_layer(tile_servers[map_type]);
    });