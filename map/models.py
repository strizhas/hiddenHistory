import os

import exifread as ef
from django.conf import settings
from django.db import models
from django.dispatch import receiver
from django.utils import timezone
from imagekit import register
from imagekit.models.fields import ImageSpecField

from . import processors

register.generator('hh:photo:img_medium', processors.MediumOrientedImage)
register.generator('hh:photo:img_small', processors.SmallOrientedImage)


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
    orientation = tags.get("Image Orientation")

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

    if orientation:
        orientation_value = orientation.values[0]
    else:
        orientation_value = 1

    return {
        'latitude': lat_value,
        'longitude': lon_value,
        'direction': direction_value,
        'altitude': altitude_value,
        'orientation': orientation_value
    }


class Photo(models.Model):
    img = models.ImageField(upload_to='photos/')
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    uploaded = models.DateTimeField(default=timezone.now)
    author = models.CharField(max_length=200, null=True)
    year = models.IntegerField(null=True)
    source = models.CharField(max_length=200, null=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    altitude = models.IntegerField(null=True)
    orientation = models.IntegerField(default=1)
    direction = models.FloatField(null=True)
    img_small = ImageSpecField(source='img', id='hh:photo:img_small')
    img_medium = ImageSpecField(source='img', id='hh:photo:img_medium')

    @staticmethod
    def save_with_exif(img, data):
        gps = get_gps(img)
        print(gps)
        if not gps:
            return False

        p = Photo()
        p.img = img
        p.longitude = gps['longitude']
        p.latitude = gps['latitude']
        p.orientation = gps['orientation']
        p.uploader = data['uploader']

        if data['year']:
            p.year = data['year']
        if data['source']:
            p.source = data['source']

        if gps['direction'] is not None:
            p.direction = gps['direction']
        if gps['altitude'] is not None:
            p.altitude = int(gps['altitude'])

        p.save()


@receiver(models.signals.post_delete, sender=Photo)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """
    Deletes file from filesystem
    when corresponding `MediaFile` object is deleted.
    """
    if instance.img:
        if os.path.isfile(instance.img.path):
            os.remove(instance.img.path)

    if instance.img_small:
        if os.path.isfile(instance.img_small.path):
            os.remove(instance.img_small.path)

    if instance.img_medium:
        if os.path.isfile(instance.img_medium.path):
            os.remove(instance.img_medium.path)
