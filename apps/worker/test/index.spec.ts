import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, vi, afterEach } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

const envv = {
	GOOGLE_API_KEY: 'test-key',
	FOLDER_ID: 'test-folder',
	ALLOWED_ORIGIN: '*',
};

afterEach(() => {
	vi.restoreAllMocks();
});

function makeResponse(files: Array<object>, nextPageToken?: string) {
	return new Response(JSON.stringify({ files, ...(nextPageToken && { nextPageToken }) }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}

async function workerCall(request: Request) {
	const context = createExecutionContext();
	const response = await worker.fetch(request as unknown as Request<unknown, IncomingRequestCfProperties<unknown>>, env, context);
	await waitOnExecutionContext(context);
	return response;
}

describe('Worker', () => {
	describe('Preflight', () => {
		it('should return status 200 for the preflight request', async () => {
			const response = await workerCall(new Request('https://worker/feed', { method: 'OPTIONS' }));
			expect(response.status).toBe(200);
			expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
			expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
		});
	});

	describe('Undefined Routes', () => {
		it('should return 404 status for the not defined route', async () => {
			const response = await workerCall(new Request('https://worker/abcd'));
			expect(response.status).toBe(404);
		});
	});

	describe('GET /feed', () => {
		it('should return videos', async () => {
			const mockFiles = [
				{
					id: 'abc123',
					name: 'video.mp4',
					size: '10485760',
				},
			];
			vi.stubGlobal('fetch', async () => makeResponse(mockFiles));
			const response = await workerCall(new Request('https://worker/feed'));
			expect(response.status).toBe(200);

			const body = await response.json<{ videos: Array<object>; nextPageToken: null }>();
			expect(body.videos.length).toBe(1);
			expect(body.videos[0]).toMatchObject({ ...mockFiles[0], size: '10 MB' });
			expect(body.nextPageToken).toBeNull();
		});

		it('should add Cache-Control', async () => {
			vi.stubGlobal('fetch', async () => {
				makeResponse([]);

				const response = await workerCall(new Request('https://worker/feed'));
				expect(response.headers.get('Cache-Control')).toContain('max-age=60');
			});
		});

		it('should set pageSize from the request', async () => {
			let url = '';
			vi.stubGlobal('fetch', async (passedUrl: string) => {
				url = passedUrl;
				return makeResponse([]);
			});
			await workerCall(new Request('https://worker/feed?pageSize=12'));
			expect(url).toContain('pageSize=12');
		});

		it('should set default pageSize', async () => {
			let url = '';
			vi.stubGlobal('fetch', async (passedUrl: string) => {
				url = passedUrl;
				return makeResponse([]);
			});
			await workerCall(new Request('https://worker/feed'));
			expect(url).toContain('pageSize=6');
		});
	});

	describe('GET /stream', () => {
		it('should return 400 for the request without fileId', async () => {
			const response = await workerCall(new Request('https://worker/stream'));
			expect(response.status).toBe(400);
		});

		it('should proxy video stream with partial content status and with the Range, Length and Type headers', async () => {
			const responseMock = {
				status: 206,
				headers: { 'Content-Type': 'video/mp4', 'Content-Range': 'bytes 0-999/5000', 'Content-Length': '1000' },
			};
			const fileName = 'anyfile';
			vi.stubGlobal('fetch', async () => new Response('bytes', responseMock));

			const response = await workerCall(new Request(`https://worker/stream?fileId=${fileName}`, { headers: { Range: 'bytes=0-999' } }));
			expect(response.status).toBe(206);
			expect(response.headers.get('Content-Range')).toBe(responseMock.headers['Content-Range']);
			expect(response.headers.get('Content-Length')).toBe(responseMock.headers['Content-Length']);
			expect(response.headers.get('Content-Type')).toBe(responseMock.headers['Content-Type']);
			expect(response.headers.get('Accept-Ranges')).toBe('bytes');
			expect(response.headers.get('Etag')).toBe(fileName);
		});

		it('should add Range header to the Google API', async () => {
			let headers!: Headers | null;
			vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
				headers = new Headers(init?.headers as HeadersInit);
				return new Response('data', { status: 200, headers: { 'Content-Type': 'video/mp4' } });
			});

			await workerCall(new Request('https://worker/stream?fileId=anyfile', { headers: { Range: 'bytes=100-200' } }));

			expect(headers?.get('Range')).toBe('bytes=100-200');
		});

		it('should add Cache-Control', async () => {
			vi.stubGlobal('fetch', async () => new Response('data', { status: 200, headers: { 'Content-Type': 'video/mp4' } }));

			const response = await workerCall(new Request('https://worker/stream?fileId=anyfile'));
			expect(response.headers.get('Cache-Control')).toContain('max-age=86400');
		});
	});

	describe('GET /thumbnail', () => {
		it('should return status 400 for the request without imageUrl', async () => {
			const response = await workerCall(new Request('https://worker/thumbnail'));
			expect(response.status).toBe(400);
		});

		it('should attach headers', async () => {
			vi.stubGlobal(
				'fetch',
				async () =>
					new Response(new Uint8Array([1, 2, 3]), {
						status: 200,
						headers: { 'Content-Type': 'image/jpeg' },
					}),
			);

			const encodedURI = encodeURIComponent('https://thumb.example.com/thumb.jpg');
			const response = await workerCall(new Request(`https://worker/thumbnail?imageUrl=${encodedURI}`));

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('image/jpeg');
			expect(response.headers.get('Cache-Control')).toContain('max-age=86400');
		});
	});
});
