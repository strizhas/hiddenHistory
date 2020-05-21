from imagekit.processors import ResizeToFit, ResizeToFill
from imagekit import ImageSpec
from imagekit.utils import get_field_info


class MediumOrientedImage(ImageSpec):
    format = 'JPEG'
    options = {'quality': 100}

    @property
    def processors(self):
        model, field_name = get_field_info(self.source)
        return [
            RotateEXIF(model.orientation),
            ResizeToFit(640, 480)
        ]


class SmallOrientedImage(ImageSpec):
    format = 'JPEG'
    options = {'quality': 80}

    @property
    def processors(self):
        model, field_name = get_field_info(self.source)
        return [
            RotateEXIF(model.orientation),
            ResizeToFill(100, 80)
        ]


class RotateEXIF(object):

    def __init__(self, orientation):
        self.orientation = orientation

    def process(self, image):
        orientation = self.orientation
        if orientation == 3:
            image = image.rotate(180, expand=True)
        elif orientation == 6:
            image = image.rotate(270, expand=True)
        elif orientation == 8:
            image = image.rotate(90, expand=True)

        return image
