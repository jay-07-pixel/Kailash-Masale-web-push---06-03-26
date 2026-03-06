# Fix Firebase Storage CORS (so Download works)

Your bucket is blocking browser requests from `http://localhost:5173` because CORS is not set. Fix it once so the **Download** button can save files to your device.

## 1. Install Google Cloud CLI (if needed)

- **Windows:** https://cloud.google.com/sdk/docs/install  
- **Mac:** `brew install google-cloud-sdk`  
- Or use **Cloud Shell** in Firebase/Google Cloud Console (no install).

## 2. Get your bucket name

In Firebase Console → **Storage** → copy the bucket name (e.g. `kailash-masale.firebasestorage.app`).

## 3. Apply CORS

**Option A – gcloud (recommended):**

```bash
gcloud storage buckets update gs://YOUR_BUCKET_NAME --cors-file=storage-cors.json
```

**Option B – gsutil:**

```bash
gsutil cors set storage-cors.json gs://YOUR_BUCKET_NAME
```

Replace `YOUR_BUCKET_NAME` with your bucket. **Your bucket:** `kailash-masale.firebasestorage.app`

**Copy-paste (your bucket):**
```bash
gsutil cors set storage-cors.json gs://kailash-masale.firebasestorage.app
```
Or with gcloud:
```bash
gcloud storage buckets update gs://kailash-masale.firebasestorage.app --cors-file=storage-cors.json
```

## 4. Add your production domain

Edit `storage-cors.json`: replace `https://yourdomain.com` with your real site URL (e.g. `https://yourapp.vercel.app`), then run the same command again.

After this, the Download button should work from localhost and your deployed site.
