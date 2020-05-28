from django.shortcuts import render
from django.conf import settings
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import HttpResponseRedirect, JsonResponse, HttpResponse
from django.shortcuts import render, redirect
from django.template.loader import render_to_string
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone

from .models import Photo
from .forms import PhotoForm
from .forms import EditForm


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
        "uploaded": p.uploaded,
        "source": p.source,
        "year": p.year,
        "id": p.id,
        "owner": p.uploader.id == request.user.id
    }

    data = render_to_string('app/img-frame.html', context=context)
    return JsonResponse(data, safe=False)


@login_required(login_url='/accounts/login/')
def edit_photo(request, pk):
    p = Photo.objects.get(pk=pk)

    context = {
        "url": p.img.url,
        "name": p.img.name,
        "author": p.author,
        "source": p.source,
        "year": p.year,
        "pk": pk
    }
    return render(request, 'app/edit_photo.html', context)


@login_required(login_url='/accounts/login/')
def save_changes(request, pk):
    if request.method != 'POST':
        return

    form = EditForm(request.POST.copy())

    if len(request.FILES.getlist("files")) != 0:
        img = request.FILES.getlist("files")[0]
    else:
        img = None

    if form.is_valid():
        if Photo.edit_with_exif(img, form.cleaned_data, pk):
            p = Photo.objects.get(pk=pk)
            response = {
                "state": "success",
                "message": "фотография обновлена",
                "src": p.img.url,
                "name": p.img.name
            }
        else:
            response = {
                "state": "error",
                "message": "В фотографии нет GPS данных"
            }
    else:
        errors = ''
        for field in form:
            for error in field.errors:
                errors += field.name + ":\n\r"
                errors += error + "\n\r"
        response = {
            "state": "error",
            "message": errors
        }

    return JsonResponse(response)


def get_photos_data(request):
    data = []
    years = []

    for item in Photo.objects.values():
        data.append({
            "latitude": item["latitude"],
            "longitude": item["longitude"],
            "direction": item["direction"],
            "altitude": item["altitude"],
            "year": item["year"],
            "id": item["id"]
        })
        if item["year"] not in years:
            years.append(item["year"])

    return JsonResponse({"data": data, "years": years}, safe=False)


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
    data = {
        "uploader": User.objects.get(id=request.user.id),
        "uploaded": timezone.now(),
        "source": request.POST.get("source"),
        "year": request.POST.get("year")
    }

    for file in request.FILES.getlist("files"):
        if Photo.save_with_exif(file, data) is False:
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
