const fs = require('fs');
const path = require('path');
const https = require('https');

const screens = [
  { id: '8e9cd6b81e66423b8b8d766058462784', title: 'Irrigation Management', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OTllZWM2Njg3NmYwOTEwN2M1Y2I2MTVlMDFjEgsSBxCEqbLk1xEYAZIBIwoKcHJvamVjdF9pZBIVQhM2NzQ5NTg1MjA4MTIyMjg5MDM3&filename=&opi=89354086' },
  { id: '6e69909dd8f24b8c8aebc28d7d627197', title: 'My Farm Overview', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OTlmM2E2YTFkOTAwN2UwMGVlODdmMjIzYjdkEgsSBxCEqbLk1xEYAZIBIwoKcHJvamVjdF9pZBIVQhM2NzQ5NTg1MjA4MTIyMjg5MDM3&filename=&opi=89354086' },
  { id: '0a3948311be342d98eae6536f42a01ed', title: 'Alert Details', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OTlmMzllMDU0NzIwNmFjNmQ0ZjZlMDRiOWZmEgsSBxCEqbLk1xEYAZIBIwoKcHJvamVjdF9pZBIVQhM2NzQ5NTg1MjA4MTIyMjg5MDM3&filename=&opi=89354086' },
  { id: '95aa6a7636464daaae0f1b77da61cdad', title: 'Organization Overview', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OTlmM2E3ZGYyODMwMzMyY2UwNDBlMjhkNGY3EgsSBxCEqbLk1xEYAZIBIwoKcHJvamVjdF9pZBIVQhM2NzQ5NTg1MjA4MTIyMjg5MDM3&filename=&opi=89354086' },
  { id: '0cfc7e33b04d4838a7f4329969402e66', title: 'Support', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OTllZmEwNzcyODgwMzMyY2UwNDBlMjhkNGY3EgsSBxCEqbLk1xEYAZIBIwoKcHJvamVjdF9pZBIVQhM2NzQ5NTg1MjA4MTIyMjg5MDM3&filename=&opi=89354086' },
  { id: 'be8a80f6b0194f56b51cbcf1a366b9d4', title: 'Advisory and Insights', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OTllZjU4ZDQxOGIwOTI1YzczNzg3MGQ2NGUwEgsSBxCEqbLk1xEYAZIBIwoKcHJvamVjdF9pZBIVQhM2NzQ5NTg1MjA4MTIyMjg5MDM3&filename=&opi=89354086' },
  { id: 'e727a36355fb4b1194ee9922fd58efe6', title: 'Expert Validation Queue', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OTlmM2FhNjQ3OTAwNTIyODJmZWI4MDhiZGQ3EgsSBxCEqbLk1xEYAZIBIwoKcHJvamVjdF9pZBIVQhM2NzQ5NTg1MjA4MTIyMjg5MDM3&filename=&opi=89354086' },
  { id: 'f2320ebc020048b5b48c48a24076fdb3', title: 'My Devices and Service', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OTlmM2UxOTliYWIwMDMwMTE0Yzk1MjhjM2FlEgsSBxCEqbLk1xEYAZIBIwoKcHJvamVjdF9pZBIVQhM2NzQ5NTg1MjA4MTIyMjg5MDM3&filename=&opi=89354086' },
  { id: '8097eaf6ceee4c07aa150d705b7a56cc', title: 'Crop Health Management', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OTllZjVlOGE5NTAwMWE2MGU0YTcyMDQxMTg0EgsSBxCEqbLk1xEYAZIBIwoKcHJvamVjdF9pZBIVQhM2NzQ5NTg1MjA4MTIyMjg5MDM3&filename=&opi=89354086' },
  { id: '09ed1dfa6638476eb968a658d9268dcc', title: 'Organization Risk Map', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OTlmM2FmMzZmNzUwOTI1YzczMzBmM2E1YzFmEgsSBxCEqbLk1xEYAZIBIwoKcHJvamVjdF9pZBIVQhM2NzQ5NTg1MjA4MTIyMjg5MDM3&filename=&opi=89354086' },
  { id: '734e82cfd8c34fc8960851b85b49292c', title: 'Expert Help Support', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OTlmMzlkNGNmNTEwOTI1ZDYyNmZhMWJhYTEzEgsSBxCEqbLk1xEYAZIBIwoKcHJvamVjdF9pZBIVQhM2NzQ5NTg1MjA4MTIyMjg5MDM3&filename=&opi=89354086' },
  { id: '48b69db8a5534469b8d72e2002837bb9', title: 'Organization Analytics Dashboard', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OTlmM2RkYjBjY2MwOTI1YzczMzBmM2E1YzFmEgsSBxCEqbLk1xEYAZIBIwoKcHJvamVjdF9pZBIVQhM2NzQ5NTg1MjA4MTIyMjg5MDM3&filename=&opi=89354086' },
  { id: 'ab39d1420e884a9a843ced35147e74c3', title: 'Devices and Maintenance Console', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1OTlmM2Y0ZjBmODcwMjJkNGVjNDY2MDk0ODVjEgsSBxCEqbLk1xEYAZIBIwoKcHJvamVjdF9pZBIVQhM2NzQ5NTg1MjA4MTIyMjg5MDM3&filename=&opi=89354086' }
];

const outDir = path.join(__dirname, 'stitch_screens');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', reject);
  });
}

async function run() {
  for (const s of screens) {
    const filename = `${s.title.replace(/[^a-zA-Z0-9]/g, '_')}_${s.id}.html`;
    const dest = path.join(outDir, filename);
    console.log(`Downloading ${s.title}...`);
    try {
      await download(s.url, dest);
      console.log(`Saved to ${dest}`);
    } catch (e) {
      console.error(`Error downloading ${s.title}:`, e.message);
    }
  }
  console.log('All screens downloaded!');
}

run();
