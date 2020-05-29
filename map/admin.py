from django.contrib import admin
from map.models import Photo
from map.models import Source


class PhotoAdmin(admin.ModelAdmin):
    list_display = ('id', 'img', 'uploaded')
    list_filter = ('source',)


admin.site.register(Photo, PhotoAdmin)
admin.site.register(Source)

# Register your models here.
