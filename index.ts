import * as http from 'http';
import * as path from 'path';
import * as querystring from 'querystring';
import * as fs from 'fs-extra-promise';
import * as mkdirp from 'mkdirp-promise';

const port = parseInt(process.argv[2], 10) ? parseInt(process.argv[2], 10) : 8080;
const pathCache = process.argv[3] ? process.argv[3] : path.resolve(__dirname, './cache');
const layerUrl = process.argv[4] ? process.argv[4] : 'http://{s}.{type}.openstreetmap.org/{z}/{x}/{y}.png';
const cacheTime = parseInt(process.argv[5], 10) ? parseInt(process.argv[5], 10) : 3600*24*30; // 30 jours

console.log('Start proxy open-street-map on:', port);

http.createServer(async (req, res) => {
	try {
		
		const match = req.url.match(/^\/([0-9]+)\/([0-9]+)\/([0-9]+).png/i)
		
		if (match === null) {
			console.log('[GET][404]', req.url);
			res.statusCode = 404;
			res.end('Not found');
			return;
		}
		
		console.log('[GET] ', req.url);
		
		const search = req.url.indexOf('?') !== -1 ? req.url.substr(req.url.indexOf('?') + 1) : '';
		const queries: any = querystring.parse(search);
		
		const type = queries['r'] ? queries['r'].replace(/[^0-9a-z]/mgi, '') : 'tile';
		
		const x = parseInt(match[2], 10);
		const y = parseInt(match[3], 10);
		const z = parseInt(match[1], 10);
		const file = path.resolve(pathCache, `${type}/${z}/${x}/${y}.png`);
		
		let noCache = true;
		const exist = await fs.existsAsync(file);
		if (exist) {
			const stats = await fs.statAsync(file);
			if (stats.isFile() && (new Date()).getTime() - stats.mtime.getTime() > cacheTime) {
				noCache = false;
			}
		}
		
		if (noCache) {
			const s = ['a', 'b', 'c'][Math.floor(Math.random() * 3)];
			const target = layerUrl
				.replace('{s}', s)
				.replace('{type}', type)
				.replace('{x}', x.toString())
				.replace('{y}', y.toString())
				.replace('{z}', z.toString())
			;
			
			console.log('No cache call', target);
			
			const dir = path.dirname(file);
			if (!(await fs.existsAsync(dir))) {
				await mkdirp(dir);	
				while(!await fs.existsAsync(dir)) {};
			}
			
			const promise: Promise<string> = new Promise((resolve, reject) => {
				let imgData = '';
				const options = {
					headers: { 'User-Agent': 'OSMProxy' }
				};
				
				http.get(target, options, res => {
					if (res.statusCode === 200) { 
						res.setEncoding('binary');
						res.on('data', chunck => imgData += chunck)
						res.on('end', () => {
							resolve(imgData);
						});
					} else {
						reject(new Error('Request Failed.\nStatus Code: '+res.statusCode));
						res.resume();
					}
				})
					.on('error', reject)
				;
			})
			const imgData = await promise;
			await fs.writeFileAsync(file, imgData, 'binary');
			
		}
		
		const stream: any = await (new Promise((resolve, reject) => {
			const stream = fs.createReadStream(file);
			stream.on('open',() => resolve(stream));
			stream.on('error', () => reject (new Error('Error on read cache file: '+file)));
		}));
		
        res.setHeader('Content-Type', 'image/png');
        stream.pipe(res);
	} catch(e) {
		console.error('[GET] ', req.url, ' :', e.toString());
		res.statusCode = 500;
		res.end(e.toString());
	}
}).listen(port);
