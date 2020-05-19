from django.db import models
from django.conf import settings
from django.utils import timezone

import exifread as ef


def _convert_to_degress(value):
    """
    Helper function to convert the GPS coordinates stored in the EXIF to degress in float format
    :param value:
    :type value: exifread.utils.Ratio
    :rtype: float
    """
    d = float(value.values[0].num) / float(value.values[0].den)
    m = float(value.values[1].num) / float(value.values[1].den)
    s = float(value.values[2].num) / float(value.values[2].den)

    return d + (m / 60.0) + (s / 3600.0)


def get_gps(img):
    """
    returns gps data if present other wise returns empty dictionary
    """

    tags = ef.process_file(img)
    latitude = tags.get('GPS GPSLatitude')
    latitude_ref = tags.get('GPS GPSLatitudeRef')
    longitude = tags.get('GPS GPSLongitude')
    longitude_ref = tags.get('GPS GPSLongitudeRef')
    direction = tags.get('GPS GPSImgDirection')
    direction_ref = tags.get('GPS GPSImgDirectionRef')
    altitude = tags.get('GPS GPSAltitude')

    if latitude:
        lat_value = _convert_to_degress(latitude)
        if latitude_ref.values != 'N':
            lat_value = -lat_value
    else:
        return {}
    if longitude:
        lon_value = _convert_to_degress(longitude)
        if longitude_ref.values != 'E':
            lon_value = -lon_value
    else:
        return {}

    if direction:
        direction_value = float(direction.values[0].num) / float(direction.values[0].den)
        if direction_ref.values != 'E':
            direction_value = -direction_value
    else:
        direction_value = None

    if altitude:
        altitude_value = float(altitude.values[0].num) / float(altitude.values[0].den)
    else:
        altitude_value = None

    return {
            'latitude': lat_value,
            'longitude': lon_value,
            'direction': direction_value,
            'altitude': altitude_value
            }


class Photo(models.Model):
    img = models.ImageField(upload_to='photos/')
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    uploaded = models.DateTimeField(default=timezone.now)
    author = models.CharField(max_length=200, null=True)
    taken = models.CharField(max_length=50, null=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    altitude = models.IntegerField(null=True)
    direction = models.FloatField(null=True)

    @staticmethod
    def save_with_exif(img):
        gps = get_gps(img)
        print(gps)
        if not gps:
            return False

        p = Photo()
        p.img = img
        p.longitude = gps['longitude']
        p.latitude = gps['latitude']

        if gps['direction'] is not None:
            p.direction = gps['direction']
        if gps['altitude'] is not None:
            p.altitude = int(gps['altitude'])

        p.save()
