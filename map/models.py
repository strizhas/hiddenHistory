import os
from uuid import uuid4

import exifread as ef
from django.conf import settings
from django.db import models
from django.dispatch import receiver
from django.utils import timezone
from imagekit import register
from imagekit.models.fields import ImageSpecField

from . import processors

register.generator('hh:photo:img_large', processors.LargeOrientedImage)
register.generator('hh:photo:img_medium', processors.MediumOrientedImage)
register.generator('hh:photo:img_small', processors.SmallOrientedImage)


def path_and_rename(instance, filename):
    path = 'photos'
    ext = filename.split('.')[-1]

    if instance.year is not None:
        year = instance.year
    else:
        if instance.decade is not None:
            year = str(instance.decade) + 's'
        else:
            year = '0000'
    filename = '{}_{}_{}.{}'.format('pic', year, uuid4().hex[:16], ext)

    return os.path.join(path, filename)


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


def get_orientation_only(img):
    tags = ef.process_file(img)
    orientation = tags.get("Image Orientation")
    if orientation:
        orientation_value = orientation.values[0]
    else:
        orientation_value = 1

    return orientation_value


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


class Source(models.Model):
    name = models.CharField(max_length=100)
    url = models.CharField(max_length=200, null=True, blank=True)


class Photo(models.Model):
    img = models.ImageField(upload_to=path_and_rename)
    filename = models.CharField(max_length=200, null=True)
    published = models.BooleanField(default=True)
    on_map = models.BooleanField(default=True)
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    uploaded = models.DateTimeField(default=timezone.now)
    author = models.CharField(max_length=200, null=True, blank=True)
    description = models.CharField(max_length=400, null=True, blank=True)
    year = models.IntegerField(null=True, blank=True)
    decade = models.IntegerField(null=True)
    source_obj = models.ForeignKey(Source, on_delete=models.SET_NULL, null=True)
    latitude = models.FloatField(null=True)
    longitude = models.FloatField(null=True)
    altitude = models.IntegerField(null=True)
    orientation = models.IntegerField(default=1)
    direction = models.FloatField(null=True)
    img_small = ImageSpecField(source='img', id='hh:photo:img_small')
    img_medium = ImageSpecField(source='img', id='hh:photo:img_medium')
    img_large = ImageSpecField(source='img', id='hh:photo:img_large')

    def delete_img(self, save=True):
        """
        :param save: - Будут ли сохранены изменения
                       в модели после удаления файла.
                       True, если после удаления файла
                       объект Photo остаётся в БД

        :return:
        """
        if settings.DEFAULT_FILE_STORAGE == 'map.s3utils.CustomS3Boto3Storage':
            if self.img:
                self.img.delete(save=save)
            return

        if self.img:
            if os.path.isfile(self.img.path):
                os.remove(self.img.path)

        if self.img_small:
            if os.path.isfile(self.img_small.path):
                os.remove(self.img_small.path)

        if self.img_medium:
            if os.path.isfile(self.img_medium.path):
                os.remove(self.img_medium.path)

    @staticmethod
    def save_with_exif(img, data):
        gps = get_gps(img)

        if not gps:
            return False

        p = Photo()
        p.img = img
        p.longitude = gps['longitude']
        p.latitude = gps['latitude']
        p.orientation = gps['orientation']
        p.uploader = data['uploader']
        p.uploaded = data['uploaded']
        p.filename = img.name

        if data['decade']:
            p.decade = data['decade']
        if data['year']:
            p.year = data['year']
        if data['source']:
            p.source_obj = Source.objects.get(pk=data['source'])
        if data['author']:
            p.author = data['author']

        if gps['direction'] is not None:
            p.direction = gps['direction']
        if gps['altitude'] is not None:
            p.altitude = int(gps['altitude'])

        p.save()
        return True

    @staticmethod
    def save_without_exif(img, data):
        p = Photo()
        p.img = img
        p.uploader = data['uploader']
        p.uploaded = data['uploaded']
        p.orientation = get_orientation_only(img)
        p.filename = img.name
        p.on_map = False

        if data['decade']:
            p.decade = data['decade']
        if data['year']:
            p.year = data['year']
        if data['source']:
            p.source_obj = Source.objects.get(pk=data['source'])
        if data['author']:
            p.author = data['author']

        p.save()
        return True

    @staticmethod
    def edit_with_exif(img, data, pk):

        p = Photo.objects.get(pk=pk)

        if img is not None:
            gps = get_gps(img)
            if not gps:
                return False

            p.delete_img()
            p.img = img
            p.longitude = gps['longitude']
            p.latitude = gps['latitude']
            p.orientation = gps['orientation']
            p.filename = img.name

            if gps['direction'] is not None:
                p.direction = gps['direction']
            if gps['altitude'] is not None:
                p.altitude = int(gps['altitude'])

        if data['year']:
            p.year = data['year']
        if data['source']:
            p.source_obj = Source.objects.get(pk=data['source'])
        if data['decade']:
            p.decade = data['decade']
        if 'published' in data:
            p.published = data['published']

        if data['description']:
            p.description = data['description']

        p.author = data['author']
        p.save()
        return True

    def get_view_context(self, request):

        if self.source_obj is not None:
            source_name = self.source_obj.name
        else:
            source_name = None

        alt = 'Завод "Серп и молот" '
        if self.year:
            alt += str(self.year)
        else:
            alt += str(self.decade) + '-ые'
        if self.description:
            alt += ' - {}'.format(self.description)

        context = {
            "url": self.img_medium.url,
            "url_large": self.img_large.url,
            "url_full": self.img.url,
            "author": self.author,
            "uploader": self.uploader.username,
            "uploaded": self.uploaded.strftime("%d.%m.%Y"),
            "source": source_name,
            "year": self.year,
            "decade": self.decade,
            "description": self.description,
            "alt": alt,
            "id": self.id,
            "owner": self.uploader.id == request.user.id
        }

        return context

    def get_public_context(self, request):

        alt = 'Завод "Серп и молот" '

        if self.year:
            alt += str(self.year)
        else:
            alt += str(self.decade) + '-ые'
        if self.description:
            alt += ' - {}'.format(self.description)

        if self.source_obj is not None:
            source_name = self.source_obj.name
        else:
            source_name = None

        context = {
            "url_large": self.img_large.url,
            "url_full": self.img.url,
            "author": self.author,
            "uploaded": self.uploaded.strftime("%d.%m.%Y"),
            "source": source_name,
            "year": self.year,
            "decade": self.decade,
            "description": self.description,
            "alt": alt,
            "id": self.id,
        }

        return context


@receiver(models.signals.post_delete, sender=Photo)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """
    Deletes file from filesystem
    when corresponding `MediaFile` object is deleted.
    """

    instance.delete_img(False)
