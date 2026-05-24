/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

interface GoogleFile {
	id: string;
	name: string;
	size?: string;
	thumbnailLink?: string;
	videoMediaMetadata?: { durationMills?: string };
}
function cors(origin: string) {
	return {
		'Access-Control-Allow-Origin': origin,
		'Access-Control-Allow-Methods': 'GET, OPTIONS',
		'Access-Control-Allow-Headers': 'Range',
		'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
	};
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const origin = env.ALLOWED_ORIGIN || '*';
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: cors(origin) });
		}
		if (url.pathname === '/feed') {
			return getVideoFeed(url, env, origin);
		}
	},
} satisfies ExportedHandler<Env>;

async function getVideoFeed(url: URL, env: Env, origin: string) {
	const pageToken = url.searchParams.get('pageToken') ?? '';

	const params = new URLSearchParams({
		key: env.GOOGLE_API_KEY,
		q: `'${env.FOLDER_ID}' in parents and mimeType contains 'video/' and trashed = false`,
		fields: 'nextPageToken, files(id, name, size,thumbnailLink, videoMediaMetadata)',
		pageSize: '3',
		orderBy: 'createdTime desc',
		...(pageToken && { pageToken }),
	});

	const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);

	if (!response.ok) {
		return new Response(JSON.stringify({ error: await response.text() }), {
			status: response.status,
			headers: { 'Content-Type': 'application/json', ...cors(origin) },
		});
	}

	const responseData: { nextPageToken?: string; files: Array<GoogleFile> } = await response.json();
	const videos = (responseData.files ?? new Array()).map(({ id, name, size, thumbnailLink, videoMediaMetadata }) => ({
		id,
		name,
		size: size ? `${bytesToMegabytes(Number(size))} MB` : null,
		thumbnail: thumbnailLink ?? null,
		duration: videoMediaMetadata?.durationMills ? formatDuration(Number(videoMediaMetadata.durationMills)) : null,
		url: `/stream?fileId=${id}`,
	}));

	return new Response(JSON.stringify({ videos, nextPageToken: responseData.nextPageToken ?? null }), {
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=60',
			...cors(origin),
		},
	});
}
