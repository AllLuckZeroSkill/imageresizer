const express = require('express');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const {GoogleAuth} = require('google-auth-library');

const app = express();
const port = 3000;

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: 'mineral-acrobat-368822',
  keyFilename: 'C:\\Users\\ihach\\OneDrive\\Desktop\\Projects\\Image Resizer\\servicekey\\mineral-acrobat-368822-08e15a39628f.json',
});
const bucket = storage.bucket('resizeapp-bucket');

// Configure multer to store files in memory
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Initialize GoogleAuth globally to reuse the configuration
const auth = new GoogleAuth({
  keyFilename: 'C:\\Users\\ihach\\OneDrive\\Desktop\\Projects\\Image Resizer\\servicekey\\mineral-acrobat-368822-58586be4eaa4.json',
});

app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const cloudFunctionUrl = 'https://us-central1-mineral-acrobat-368822.cloudfunctions.net/resizeImage'; // Replace with your Cloud Function URL
  try {
    // Use the already initialized auth for getting the client
    const client = await auth.getIdTokenClient(cloudFunctionUrl);
    const response = await client.request({
      url: cloudFunctionUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        image: req.file.buffer.toString('base64'),
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        width: req.body.width,
        height: req.body.height,
        lockAspectRatio: req.body.lockAspectRatio === 'on',
      }),
    });

    res.status(200).send(response.data);
  } catch (error) {
    console.error('Error sending image to Cloud Function:', error);
    res.status(500).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
