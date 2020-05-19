from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include
from django.urls import path

from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.load_photo),
    path('new', views.load_photo, name='load_photo'),
    path('show', views.show, name='show'),
    path('upload_img', views.upload_img),
    path('upload_with_exif', views.upload_with_exif),
    path('accounts/', include('django.contrib.auth.urls')),

]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
