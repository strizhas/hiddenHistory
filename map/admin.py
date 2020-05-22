from django.contrib import admin
from map.models import Photo


class PhotoAdmin(admin.ModelAdmin):
    list_display = ('id', 'img', 'uploaded')


admin.site.register(Photo, PhotoAdmin)

# Register your models here.
