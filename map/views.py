from django.shortcuts import render
from django.conf import settings
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import HttpResponseRedirect, JsonResponse, HttpResponse
from django.shortcuts import render, redirect
from django.template.loader import render_to_string
from django.urls import reverse
from django.contrib.auth.models import User

from .models import Photo
from .forms import PhotoForm


def show(request):
    return render(request, 'app/map.html')


@login_required(login_url='/accounts/login/')
def load_photo(request):
    form = PhotoForm()
    return render(request, 'app/load_photo.html', {'form': form})


def get_photo(request):
    photo_id = request.GET.get("id")
    p = Photo.objects.get(pk=photo_id)
    context = {
        "url": p.img_medium.url,
        "url_full": p.img.url,
        "author": p.author,
        "uploader": p.uploader,
        "uploaded": p.uploaded
    }
    print(p)
    print(context)
    data = render_to_string('app/img-frame.html', context=context)
    return JsonResponse(data, safe=False)


def get_photos_data(request):
    data = []
    for item in Photo.objects.values():
        data.append({
            "latitude": item["latitude"],
            "longitude": item["longitude"],
            "direction": item["direction"],
            "altitude": item["altitude"],
            "id": item["id"]
        })

    return JsonResponse(data, safe=False)


@login_required(login_url='/accounts/login/')
def upload_img(request):
    if request.method != 'POST':
        return
    form = PhotoForm(request.POST, request.FILES)
    if form.is_valid():
        m = Photo()
        m.position = form.cleaned_data['position']
        m.location = form.cleaned_data['location']
        m.uploader = User.objects.get(id=request.user.id)
        m.img = form.cleaned_data['img']
        m.save()
        return HttpResponse('image upload success')


@login_required(login_url='/accounts/login/')
def upload_with_exif(request):
    if request.method != 'POST':
        return

    failed = []
    for file in request.FILES.getlist("files"):
        if Photo.save_with_exif(file) is False:
            failed.append(file.name)

    if len(failed) == 0:
        response = {
            "state": "success",
            "message": "фотографии загружены"
        }
    else:
        message = "в следующих файлах отсутсвуют геоданные: \n\r"
        message += "\n\r".join(failed)
        response = {
            "state": "error",
            "message": message
        }
    return JsonResponse(response)
