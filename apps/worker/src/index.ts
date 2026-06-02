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

function bytesToMegabytes(bytes: number): number {
	return Math.round(((bytes / 1024 / 1024) * 10) / 10);
}

function formatDuration(ms: number): string {
	const s = Math.floor(ms / 1000);
	const m = Math.floor(s / 60);
	return `${m}:${String(s % 60).padStart(2, '0')}`;
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

		if (url.pathname === '/stream') {
			return getVideoStream(request, url, env, origin);
		}

		if (url.pathname === '/thumbnail') {
			return getThumbnail(url, env, origin);
		}

		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;

async function getVideoFeed(url: URL, env: Env, origin: string) {
	const pageToken = url.searchParams.get('pageToken') ?? '';

	const params = new URLSearchParams({
		key: env.GOOGLE_API_KEY,
		q: `'${env.FOLDER_ID}' in parents and mimeType contains 'video/' and trashed = false`,
		fields: 'nextPageToken, files(id, name, size,thumbnailLink, videoMediaMetadata)',
		pageSize: '6',
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
		thumbnail: thumbnailLink ? `/thumbnail?imageUrl=${encodeURIComponent(thumbnailLink)}` : null,
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
async function getVideoStream(request: Request, url: URL, env: Env, origin: string) {
	const fileId = url.searchParams.get('fileId');

	if (!fileId) {
		return new Response('fileId required', { status: 400 });
	}
	// TODO:: SecurityWarning(!) валидировать fileId регуляркой

	const rangeHeader = request.headers.get('Range') ?? '';
	const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${env.GOOGLE_API_KEY}`, {
		headers: { ...(rangeHeader && { Range: rangeHeader }) },
	});

	if (!response.ok && response.status !== 206) {
		return new Response('Failed to fetch', {
			status: response.status,
			headers: cors(origin),
		});
	}

	const headers = new Headers({
		'Content-Type': response.headers.get('Content-Type') ?? 'video/mp4',
		'Accept-Ranges': 'bytes',
		'Cache-Control': 'public, max-age=86400',
		ETag: fileId,

		...cors(origin),
	});

	const contentRange = response.headers.get('Content-Range');
	const contentLength = response.headers.get('Content-Length');
	if (contentRange) headers.set('Content-Range', contentRange);
	if (contentLength) headers.set('Content-Length', contentLength);

	return new Response(response.body, {
		status: response.status,
		headers,
	});
}

async function getThumbnail(url: URL, env: Env, origin: string) {
	const imageUrl = url.searchParams.get('imageUrl');
	if (!imageUrl) return new Response('imageUrl requierd', { status: 400 });

	//TODO: imageUrl verification
	const imageResult = await fetch(imageUrl);

	if (!imageResult.ok) {
		return new Response('Failed to load image', { status: imageResult.status });
	}

	return new Response(imageResult.body, {
		headers: {
			'Content-Type': imageResult.headers.get('Content-Type') ?? 'image/jpeg',
			'Cache-Control': 'public, max-age=86400',
			...cors(origin),
		},
	});
}
