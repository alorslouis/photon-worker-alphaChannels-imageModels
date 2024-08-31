/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { PhotonImage, SamplingFilter, blend, resize } from "@cf-wasm/photon";

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


		const resizedB = resize(
			inputImageB,
			inputImageA.get_width(),
			inputImageA.get_height(),
			SamplingFilter.Nearest
		);
		blend(inputImageA, resizedB, "xor")

		// resize image using photon
		// get webp bytes
		const outputBytes = inputImageA.get_bytes_webp();

		// for other formats
		// png  : outputImage.get_bytes();
		// jpeg : outputImage.get_bytes_jpeg(quality);

		// call free() method to free memory
		inputImageA.free();
		inputImageB.free();

		// return the Response instance
		return new Response(outputBytes, {
			headers: {
				"Content-Type": "image/webp"
			}
		});
	}
} satisfies ExportedHandler;
