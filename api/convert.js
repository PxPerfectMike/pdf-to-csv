import pdf from 'pdf-parse';

export const config = {
	api: {
		bodyParser: false,
	},
};

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		res.status(405).send('Only POST supported');
		return;
	}

	try {
		const chunks = [];
		req.on('data', (chunk) => chunks.push(chunk));
		req.on('end', async () => {
			const buffer = Buffer.concat(chunks);

			try {
				const parsed = await pdf(buffer);
				const lines = parsed.text
					.split('\n')
					.map((line) => line.trim().replace(/\s{2,}/g, ','));

				res.setHeader('Content-Type', 'text/csv');
				res.setHeader(
					'Content-Disposition',
					'inline; filename="output.csv"'
				);
				res.status(200).send(lines.join('\n'));
			} catch (innerErr) {
				console.error('PDF parse error:', innerErr);
				res.status(500).send('Error parsing PDF');
			}
		});
	} catch (err) {
		console.error('Request error:', err);
		res.status(500).send('Server error');
	}
}
