from django import forms
from location_field.forms.plain import PlainLocationField


class PhotoForm(forms.Form):
    location = forms.CharField(help_text="город")
    position = PlainLocationField(based_fields=['location'], initial='-22.2876834,-49.1607606')
    img = forms.ImageField()
