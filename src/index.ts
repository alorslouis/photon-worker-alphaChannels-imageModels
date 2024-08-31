import { PhotonImage, SamplingFilter, blend, resize, } from "@cf-wasm/photon";
import * as photon from "@cf-wasm/photon";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// url of image to fetch
		// fetch image and get the Uint8Array instance
		const formData = await request.formData();
		const imageFile = formData.get('image1');
		const imageFileTwo = formData.get('image2');

		if (!imageFile || typeof imageFile === "string" || !imageFileTwo || typeof imageFileTwo === "string") {
			return new Response('image file error', { status: 400 });
		}

		// Convert the image file to a Uint8Array
		// image A
		const arrayBufferA = await imageFile.arrayBuffer();
		const inputBytesA = new Uint8Array(arrayBufferA);

		// image B
		const arrayBufferB = await imageFileTwo.arrayBuffer();
		const inputBytesB = new Uint8Array(arrayBufferB);

		// create a PhotonImage instance
		const inputImageA = PhotonImage.new_from_byteslice(inputBytesA);
		const inputImageB = PhotonImage.new_from_byteslice(inputBytesB);

		interface RPVex {
			r: number,
			g: number,
			b: number,
			a: number,
		}

		const rawPixVex: RPVex[] = []

		const rawPStringVex: string[] = []

		const rawPixA = inputImageA.get_raw_pixels()
		const rawPixB = inputImageB.get_raw_pixels()

		for (let i = 0; i < rawPixA.length; i += 4) {
			rawPixVex.push({
				r: rawPixA[i],
				g: rawPixA[i + 1],
				b: rawPixA[i + 2],
				a: rawPixA[i + 3],
			})


			rawPixA[i + 3] !== 0 && rawPStringVex.push(JSON.stringify({
				r: rawPixA[i],
				g: rawPixA[i + 1],
				b: rawPixA[i + 2],
				a: rawPixA[i + 3],
			}))
		}


		console.log([... new Set(rawPStringVex)].map(x => JSON.parse(x)))

		const resizedB = resize(
			inputImageB,
			inputImageA.get_width(),
			inputImageA.get_height(),
			SamplingFilter.Nearest
		);


		const newImageRawArray: number[][] = []

		async function ProcessPixels() {

			for (let i = 0; i < rawPixA.length; i += 4) {
				const sliceImageA: RPVex = {
					r: rawPixA[i],
					g: rawPixA[i + 1],
					b: rawPixA[i + 2],
					a: rawPixA[i + 3],
				}
				const sliceImageB: RPVex = {
					r: rawPixB[i],
					g: rawPixB[i + 1],
					b: rawPixB[i + 2],
					a: rawPixB[i + 3],
				}

				newImageRawArray.push(Object.values(sliceImageA))

				//if (sliceImageA.a === 0) {
				//	newImageRawArray.push(Object.values(sliceImageA))
				//} else {
				//	newImageRawArray.push(Object.values(sliceImageB))
				//}
			}


		}

		await ProcessPixels()

		//console.log(rawPixVex.slice(-10))
		//console.log([...new Set(rawPStringVex)].map(x => JSON.parse(x)))

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

		//blend(inputImageA, resizedB, blendModes[6])


		const flatIntArray = newImageRawArray.flat()

		console.log(flatIntArray.slice(0, 20))



		const clampedArray = new Uint8ClampedArray(flatIntArray)

		console.log(clampedArray.slice(-10))

		for (let i = 0; i < flatIntArray.length; i++) {
			clampedArray[i] = flatIntArray[i]
		}

		let f = inputImageA.get_image_data()

		const { data, ...rest } = f
		console.log(rest)

		//f.raw_pixels = flatIntArray
		//console.log(f)

		inputImageA.set_imgdata(f)


		// resize image using photon
		// get webp bytes
		const outputBytes = inputImageA.get_bytes_webp();

		// call free() method to free memory
		inputImageA.free();
		inputImageB.free();
		resizedB.free();

		// return the Response instance
		return new Response(outputBytes, {
			headers: {
				"Content-Type": "image/webp"
			}
		});
	}
} satisfies ExportedHandler;
