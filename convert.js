import pdf from 'pdf-parse';

export const config = {
	api: {
		bodyParser: false, // we'll manually handle raw PDF buffer
	},
};

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).send('Method Not Allowed');
	}

	try {
		const buffers = [];

		req.on('data', (chunk) => buffers.push(chunk));
		req.on('end', async () => {
			const pdfBuffer = Buffer.concat(buffers);
			const parsed = await pdf(pdfBuffer);

			// Simple CSV: turn lines into rows, break long spaces into commas
			const lines = parsed.text
				.split('\n')
				.map((line) => line.trim().replace(/\s{2,}/g, ','));

			const csv = lines.join('\n');

			res.setHeader('Content-Type', 'text/csv');
			res.setHeader(
				'Content-Disposition',
				'inline; filename="result.csv"'
			);
			res.status(200).send(csv);
		});
	} catch (err) {
		res.status(500).send('Error parsing PDF');
	}
}
