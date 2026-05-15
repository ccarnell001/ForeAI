import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'foreai-frames';

export async function uploadFrame(key, base64Data, contentType = 'image/jpeg') {
  const buffer = Buffer.from(base64Data, 'base64');
  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return key;
}

export async function uploadSessionFrames(sessionId, userId, phases) {
  const frameUrls = {};
  
  for (const phase of phases) {
    if (phase.frameImage) {
      const key = `frames/${userId}/${sessionId}/${phase.name.replace(/\s+/g, '_')}_primary.jpg`;
      try {
        await uploadFrame(key, phase.frameImage);
        if (!frameUrls[phase.name]) frameUrls[phase.name] = {};
        frameUrls[phase.name].primary = key;
        console.log(`☁️  Uploaded primary frame: ${key}`);
      } catch (err) {
        console.error(`⚠️ Failed to upload primary frame for ${phase.name}:`, err.message);
      }
    }
    if (phase.frameImage2) {
      const key = `frames/${userId}/${sessionId}/${phase.name.replace(/\s+/g, '_')}_dtl.jpg`;
      try {
        await uploadFrame(key, phase.frameImage2);
        if (!frameUrls[phase.name]) frameUrls[phase.name] = {};
        frameUrls[phase.name].dtl = key;
        console.log(`☁️  Uploaded DTL frame: ${key}`);
      } catch (err) {
        console.error(`⚠️ Failed to upload DTL frame for ${phase.name}:`, err.message);
      }
    }
  }
  
  return frameUrls;
}

export async function getFrameAsBase64(key) {
  try {
    const response = await client.send(new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }));
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('base64');
  } catch (err) {
    console.error(`⚠️ Failed to retrieve frame ${key}:`, err.message);
    return null;
  }
}
