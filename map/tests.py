from django.test import TestCase
from map.forms import PhotoDataForm


class PhotoFormTest(TestCase):
    def test_wrong_decade(self):
        form_data = {
            'year': 1951,
            'decade': 1970
        }
        form = PhotoDataForm(data=form_data)
        self.assertFalse(form.is_valid())

    def test_right_decade(self):
        form_data = {
            'year': 1951,
            'decade': 1950
        }
        form = PhotoDataForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_no_year(self):
        form_data = {
            'decade': 1950
        }
        form = PhotoDataForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_wrong_year(self):
        form_data = {
            'year': 2100
        }
        form = PhotoDataForm(data=form_data)
        self.assertFalse(form.is_valid())

    def test_no_decade(self):
        form_data = {
            'year': 1971,
            'decade': ''
        }
        form = PhotoDataForm(data=form_data)
        self.assertFalse(form.is_valid())

