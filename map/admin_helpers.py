from .models import Photo
from .models import Source


def update_decade():
    ps = Photo.objects.all()
    for p in ps:
        if p.decade is not None or p.year is None:
            continue

        d = str(p.year)[0:3] + '0'
        p.decade = d
        p.save()


def set_default_source():
    ps = Photo.objects.all()
    source = Source.objects.get(pk=1)

    for p in ps:
        if p.source_obj is not None:
            continue
        p.source_obj = source
        p.save()
