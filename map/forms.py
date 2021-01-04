from django import forms
from location_field.forms.plain import PlainLocationField
from django.utils import timezone


class PhotoForm(forms.Form):
    location = forms.CharField(help_text='город')
    position = PlainLocationField(based_fields=['location'], initial='-22.2876834,-49.1607606')
    img = forms.ImageField()


class PhotoDataForm(forms.Form):
    year = forms.CharField(help_text='год, когда сделана фотография', required=False)
    decade = forms.CharField(help_text='десятилетие', required=False)
    source = forms.CharField(help_text='источник', required=False)
    author = forms.CharField(help_text='Автор фотографии', required=False)
    description = forms.CharField(help_text='описание', required=False)
    published = forms.BooleanField(required=False)

    def clean_decade(self):

        decade = self.cleaned_data['decade']
        if 'year' not in self.cleaned_data:
            return decade

        year = self.cleaned_data['year']

        if decade == '' and year != '':
            raise forms.ValidationError('не указано десятилетие')

        if decade != '' and year != '':
            if decade != str(year)[0:3] + '0':
                raise forms.ValidationError('десятилетие не совпадает с годом')
        return decade

    def clean_year(self):

        if 'year' not in self.cleaned_data:
            return None

        year = self.cleaned_data['year']
        if year != '':
            year_now = timezone.now().year
            if int(year) > year_now:
                raise forms.ValidationError('год не может быть больше ' + str(year_now))

        return year


class SourceForm(forms.Form):
    name = forms.CharField(help_text='название')
    url = forms.CharField(help_text='ссылка на название', required=False)
