import Busboy from 'busboy';
import pdf from 'pdf-parse';

export const config = {
	api: {
		bodyParser: false,
	},
};

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).send('Method Not Allowed');
	}

	const busboy = Busboy({ headers: req.headers });

	let pdfBuffer = Buffer.alloc(0);

	const parseFile = () =>
		new Promise((resolve, reject) => {
			busboy.on('file', (_fieldname, file) => {
				file.on('data', (data) => {
					pdfBuffer = Buffer.concat([pdfBuffer, data]);
				});

				file.on('end', () => {
					resolve();
				});
			});

			busboy.on('error', (err) => reject(err));
			req.pipe(busboy);
		});

	try {
		await parseFile();

		const parsed = await pdf(pdfBuffer);

		const lines = parsed.text
			.split('\n')
			.map((line) => line.trim().replace(/\s{2,}/g, ','));

		const csv = lines.join('\n');

		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', 'inline; filename="output.csv"');
		res.status(200).send(csv);
	} catch (err) {
		console.error('Error parsing PDF:', err);
		res.status(500).send('Error parsing PDF file');
	}
}
