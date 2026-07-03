import http from 'node:http';

const bootstrap = () => {
	const defaultAppConfig = {
		name: 'cdd-node-app',
		logLevel: 'info',
		port: 3000
	};

	const appConfig = {
		...defaultAppConfig,
		...process.env
	};

	const server = http.createServer((req, res) => {
		if (req.url === '/health/ready') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ status: 'ok', app: appConfig.name }));
			return;
		}

		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(
			JSON.stringify({
				app: appConfig.name,
				logLevel: appConfig.logLevel,
				uptime: process.uptime()
			})
		);
	});

	server.listen(appConfig.port, () => {
		console.log(
			`[Bootstrap]: ${appConfig.name} listening on :${appConfig.port} (log=${appConfig.logLevel})`
		);
	});
};

void bootstrap()