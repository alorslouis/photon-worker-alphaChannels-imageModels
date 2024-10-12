quick'n'dirty solve for transparentImage[ alpha channels ] => image models

this allows for focused depth masking of image-to-image

why pay extra for complicated models to do this for you?

uses [photon](https://github.com/silvia-odwyer/photon) to flip depth mask pixels to black based on transparent reference image

> :heavy_check_mark: **New**: dumb masks from transparent PNG! `functions/maskFromPng`
