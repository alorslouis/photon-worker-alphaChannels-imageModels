import { PhotonImage, SamplingFilter, blend, resize } from "@cf-wasm/photon";

export async function MaskFromPNG(formDataIn: FormData) {

	const formData = formDataIn;
	const depthMap = formData.get("inputPNG");
	//const referenceImage = formData.get('referenceTransparent');

	if (!depthMap || typeof depthMap === "string") {
		return new Response('image file error', { status: 400 });
	}

	// image A - depth map
	const arrayBufferA = await depthMap.arrayBuffer();
	const inputBytesA = new Uint8Array(arrayBufferA);


	const inputImageA = PhotonImage.new_from_byteslice(inputBytesA);

	interface RPVex {
		r: number,
		g: number,
		b: number,
		a: number,
	}

	const rawPixA = inputImageA.get_raw_pixels()

	const alphaSet = new Set()

	const newImageRawArray: number[] = []

	for (let i = 0; i < rawPixA.length; i += 4) {
		const sliceImageA: RPVex = {
			r: rawPixA[i],
			g: rawPixA[i + 1],
			b: rawPixA[i + 2],
			a: rawPixA[i + 3],
		}

		alphaSet.add(sliceImageA.a)

		// ew gross
		// but nicer than .flat ¯\_(ツ)_/¯
		if (sliceImageA.a >= 200) {
			//newImageRawArray.push(sliceImageA.r, sliceImageA.g, sliceImageA.b, sliceImageA.a)
			newImageRawArray.push(255, 255, 255, 255)
		} else {
			newImageRawArray.push(0, 0, 0, 255)
		}
	}

	console.log({ alphaSet })

	const customImageData = {
		data: new Uint8ClampedArray(newImageRawArray),
		width: inputImageA.get_width(),
		height: inputImageA.get_height()
	};

	inputImageA.set_imgdata(customImageData)

	//const resizedA = resize(
	//	inputImageA,
	//	inputImageA.get_width() * 0.5,
	//	inputImageA.get_height() * 0.5,
	//	SamplingFilter.Nearest
	//)

	const outputBytes = inputImageA.get_bytes_webp();

	// call free() method to free memory
	inputImageA.free();
	//resizedA.free();

	return outputBytes
}

