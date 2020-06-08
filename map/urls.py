from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls import url
from django.contrib import admin
from django.urls import include
from django.urls import path

from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.show, name='map'),
    path('albums', views.show_albums, name='albums'),
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
    path('require_source_form', views.require_source_form),
    path('save_new_source', views.save_new_source)
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
