from django.contrib import admin
from map.models import Photo
from map.models import Source


class PhotoAdmin(admin.ModelAdmin):
    list_display = ('id', 'filename', 'uploaded')
    list_filter = ('source_obj', 'published')


class SourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'url')


admin.site.register(Photo, PhotoAdmin)
admin.site.register(Source, SourceAdmin)
