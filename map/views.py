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
from .models import Source
from .forms import PhotoForm
from .forms import PhotoDataForm
from .forms import SourceForm


def show(request):
    return render(request, 'app/map.html')


@login_required(login_url='/accounts/login/')
def load_photo(request):
    form = PhotoForm()
    sources = Source.objects.values()
    context = {
        'form': form,
        'sources': sources
    }
    return render(request, 'app/load_photo.html', context)


def get_photo(request):
    photo_id = request.GET.get("id")
    p = Photo.objects.get(pk=photo_id)

    if p.source_obj is not None:
        source_name = p.source_obj.name
    else:
        source_name = None

    context = {
        "url": p.img_medium.url,
        "url_full": p.img.url,
        "author": p.author,
        "uploader": p.uploader,
        "uploaded": p.uploaded.strftime("%d.%m.%Y"),
        "source": source_name,
        "year": p.year,
        "id": p.id,
        "owner": p.uploader.id == request.user.id
    }

    data = render_to_string('app/img-frame.html', context=context)
    return JsonResponse(data, safe=False)


def get_preview(request):
    photo_id = request.GET.get("id")
    p = Photo.objects.get(pk=photo_id)

    return JsonResponse({"url": p.img_small.url})


@login_required(login_url='/accounts/login/')
def edit_photo(request, pk):
    p = Photo.objects.get(pk=pk)
    sources = Source.objects.values()

    context = {
        "url": p.img.url,
        "author": p.author or '',
        'sources': sources,
        'filename': p.filename,
        'source': p.source_obj.id,
        'source_old': p.source,
        "year": p.year or '',
        "decade": p.decade or '',
        "pk": pk
    }
    return render(request, 'app/edit_photo.html', context)


@login_required(login_url='/accounts/login/')
def save_changes(request, pk):
    if request.method != 'POST':
        return

    form = PhotoDataForm(request.POST.copy())

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
    data = {}
    years = []

    for item in Photo.objects.values():
        if item["decade"] not in data:
            data[item["decade"]] = []

        data[item["decade"]].append({
            "latitude": item["latitude"],
            "longitude": item["longitude"],
            "direction": item["direction"],
            "altitude": item["altitude"],
            "year": item["year"],
            "id": item["id"]
        })

        if item["year"] not in years:
            years.append(item["year"])

    years.sort()

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

    form = PhotoDataForm(request.POST.copy())
    if form.is_valid():
        failed = []
        data = {
            "uploader": User.objects.get(id=request.user.id),
            "uploaded": timezone.now(),
            "source": request.POST.get("source"),
            "author": request.POST.get("author"),
            "year": request.POST.get("year"),
            "decade": request.POST.get("decade")
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
    else:
        response = create_error_response(form)

    return JsonResponse(response)


def require_source_form(request):
    if request.method != 'GET':
        return

    data = render_to_string('app/source-form.html')
    return JsonResponse(data, safe=False)


def save_new_source(request):
    if request.method != 'POST':
        return

    form = SourceForm(request.POST)
    if form.is_valid():
        s = Source()

        s.name = form.cleaned_data['name']
        s.url = form.cleaned_data['url']
        response = {
            "state": "error",
            "message": "Источник создан"
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


def create_error_response(form):
    errors = ''
    for field in form:
        for error in field.errors:
            errors += field.name + ":\n\r"
            errors += error + "\n\r"
    return {
        "state": "error",
        "message": errors
    }