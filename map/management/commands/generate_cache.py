from django.core.management.base import BaseCommand

from map.models import Photo


class Command(BaseCommand):
    help = "Generate thumbnails of galeria's pictures."

    def handle(self, *args, **options):
        print(options['id'])
        for p in Photo.objects.all():
            if options['id'] is not None and p.id < options['id']:
                continue
            p.img_small.generate()
            p.img_medium.generate()
            p.img_large.generate()

    def add_arguments(self, parser):
        """
        Пришлось добавить аргумент ID, поскольку надо
        было перегенировать кэш и процесс умер из-за
        нехватки памяти, не обработав какое-то количество
        фоток.
        Так что указываем id чтобы заново все не считать
        """
        parser.add_argument(
            '--id',
            type=int,
            help='сделать превью изображений с ID больше указанного'
        )
