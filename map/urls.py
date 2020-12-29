from django.conf import settings

from django.conf.urls import url
from django.contrib import admin
from django.urls import include
from django.urls import path
from django.views.generic import TemplateView

from . import views

app_name = 'mmz'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', TemplateView.as_view(
        template_name='longread/public/django-templates/prologue/index.html'),
         name='history'),
    path('osnovanie_zavoda', TemplateView.as_view(
            template_name='longread/public/django-templates/chapter_1/index.html'),
             name='osnovanie_zavoda'),
    path('zavod_v_nachale_veka', TemplateView.as_view(
        template_name='longread/public/django-templates/chapter_2/index.html'),
        name='zavod_v_nachale_veka'),
    path('zavod_posle_revolucii', TemplateView.as_view(
        template_name='longread/public/django-templates/chapter_3/index.html'),
        name='zavod_posle_revolucii'),
    path('rekonstrukciya_zavoda', TemplateView.as_view(
            template_name='longread/public/django-templates/chapter_4/index.html'),
            name='rekonstrukciya_zavoda'),
    path('albums', views.show_albums, name='albums'),
    path('about', views.show_about, name='about'),
    path('map', views.show_map, name='map'),
    path('upload', views.load_photo, name='load_photo'),
    path('upload_img', views.upload_img),
    path('get_photo', views.get_photo),
    path('get_preview', views.get_preview),
    url(r'^show/(?P<pk>\d+)$', views.show_photo, name='show'),
    url(r'^photo/(?P<pk>\d+)$', views.edit_photo, name='view'),
    url(r'^edit_photo/(?P<pk>\d+)$', views.edit_photo, name='edit'),
    url(r'^save_changes/(?P<pk>\d+)$', views.save_changes),
    path('get_photos_data', views.get_photos_data),
    path('upload_with_exif', views.upload_with_exif),
    path('accounts/', include('django.contrib.auth.urls')),

    # AJAX запросы
    path('require_sources', views.require_sources),
    path('require_source_form', views.require_source_form),
    path('save_new_source', views.save_new_source)
]
