import http from 'node:http';

const bootstrap = () => {
	const defaultAppConfig = {
		name: 'cdd-node-app',
		logLevel: 'info',
		port: 3000
	};

	const appConfig = {
		name: process.env.APP_NAME ?? defaultAppConfig.name,
		logLevel: process.env.LOG_LEVEL ?? defaultAppConfig.logLevel,
		port: Number(process.env.APP_PORT ?? defaultAppConfig.port)
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