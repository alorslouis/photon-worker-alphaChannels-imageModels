import { PhotonImage, SamplingFilter, blend, resize } from "@cf-wasm/photon";

const blendModes = [
	"overlay",
	"over",
	"atop",
	"xor",
	"multiply",
	"burn",
	"soft_light",
	"hard_light",
	"difference",
	"lighten",
	"darken",
	"dodge",
	"plus",
	"exclusion"
]

export default {
	async fetch(request, env, ctx): Promise<Response> {

		const formData = await request.formData();
		const depthMap = formData.get('depthMap');
		const referenceImage = formData.get('referenceTransparent');

		if (!depthMap || typeof depthMap === "string" || !referenceImage || typeof referenceImage === "string") {
			return new Response('image file error', { status: 400 });
		}

		// image A - depth map
		const arrayBufferA = await depthMap.arrayBuffer();
		const inputBytesA = new Uint8Array(arrayBufferA);

		// image B - reference transparent
		const arrayBufferB = await referenceImage.arrayBuffer();
		const inputBytesB = new Uint8Array(arrayBufferB);

		const inputImageA = PhotonImage.new_from_byteslice(inputBytesA);
		const inputImageB = PhotonImage.new_from_byteslice(inputBytesB);


		interface RPVex {
			r: number,
			g: number,
			b: number,
			a: number,
		}

		const rawPixA = inputImageA.get_raw_pixels()

		const resizedB = resize(
			inputImageB,
			inputImageA.get_width(),
			inputImageA.get_height(),
			SamplingFilter.Nearest
		);

		const resizedBRaw = resizedB.get_raw_pixels()

		const newImageRawArray: number[] = []

		for (let i = 0; i < rawPixA.length; i += 4) {
			const sliceImageA: RPVex = {
				r: rawPixA[i],
				g: rawPixA[i + 1],
				b: rawPixA[i + 2],
				a: rawPixA[i + 3],
			}
			const sliceImageB: RPVex = {
				r: resizedBRaw[i],
				g: resizedBRaw[i + 1],
				b: resizedBRaw[i + 2],
				a: resizedBRaw[i + 3],
			}

			// ew gross
			// but nicer than .flat ¯\_(ツ)_/¯
			if (sliceImageB.a !== 0) {
				newImageRawArray.push(sliceImageA.r, sliceImageA.g, sliceImageA.b, sliceImageA.a)
			} else {
				newImageRawArray.push(0, 0, 0, 255)
			}
		}


		const customImageData = {
			data: new Uint8ClampedArray(newImageRawArray),
			width: inputImageA.get_width(),
			height: inputImageA.get_height()
		};

		inputImageA.set_imgdata(customImageData)

		const resizedA = resize(
			inputImageA,
			inputImageA.get_width() * 0.5,
			inputImageA.get_height() * 0.5,
			SamplingFilter.Nearest
		)

		const outputBytes = resizedA.get_bytes_webp();

		// call free() method to free memory
		inputImageA.free();
		inputImageB.free();
		resizedB.free();
		resizedA.free();

		return new Response(outputBytes, {
			headers: {
				"Content-Type": "image/webp"
			}
		});
	}
} satisfies ExportedHandler;
