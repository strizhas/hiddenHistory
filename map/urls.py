from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls import url
from django.contrib import admin
from django.urls import include
from django.urls import path

from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.show),
    path('upload', views.load_photo, name='load_photo'),
    path('upload_img', views.upload_img),
    path('get_photo', views.get_photo),
    url(r'^edit_photo/(?P<pk>\d+)$', views.edit_photo, name='edit'),
    url(r'^save_changes/(?P<pk>\d+)$', views.save_changes),
    path('get_photos_data', views.get_photos_data),
    path('upload_with_exif', views.upload_with_exif),
    path('accounts/', include('django.contrib.auth.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
