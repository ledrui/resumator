#!/usr/bin/env node

const {readdirSync, lstatSync} = require('fs');
const Client = require('ftp');
const host = 'stalactite.ftp.evennode.com';
const [user, password] = process.argv.slice(-2);

function* scrape(dir, ignore = new Set()) {
	for (let file of readdirSync(dir)) {
		const path = `${dir}/${file}`;
		if (file[0] === '.' || ignore.has(path)) {
			continue;
		}

		if (lstatSync(path).isDirectory()) {
			yield {path, dir: true};
			yield* scrape(path, ignore);
		} else {
			yield {path, dir: false};
		}
	}
}

const forbidden = [
	'./upload.js',
	'./node_modules'
];

const c = new Client();

function upload(local, remote = local) {
	return new Promise((win, fail) => {
		c.put(local, remote, (err) => {
			if (err)
				fail(err);
			else
				win();
		});
	});
}

async function run() {
	console.log('running...');
	for (let {path, dir} of scrape('.', new Set(forbidden))) {
		if (dir)
			continue;
		await upload(path);
		console.log('^', path);
	}

	c.end();
}

c.on('ready', run);
c.connect({host, user, password});
