from django.core.management.base import BaseCommand

from map.models import Photo


class Command(BaseCommand):
    help = "Generate thumbnails of galeria's pictures."

    def handle(self, *args, **options):
        for p in Photo.objects.all():
            p.img_small.generate()
            p.img_medium.generate()
