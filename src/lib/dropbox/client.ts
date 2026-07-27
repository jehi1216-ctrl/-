const DROPBOX_APP_KEY = process.env.DROPBOX_APP_KEY!;
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET!;
const DROPBOX_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN!;

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: DROPBOX_REFRESH_TOKEN,
      client_id: DROPBOX_APP_KEY,
      client_secret: DROPBOX_APP_SECRET,
    }),
  });

  if (!res.ok) {
    throw new Error(`Dropbox 토큰 갱신 실패: ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.accessToken;
}

export async function uploadToDropbox(path: string, file: File): Promise<void> {
  const accessToken = await getAccessToken();
  const buffer = Buffer.from(await file.arrayBuffer());

  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({
        path,
        mode: "add",
        autorename: true,
        mute: true,
      }),
    },
    body: buffer,
  });

  if (!res.ok) {
    throw new Error(`Dropbox 업로드 실패: ${await res.text()}`);
  }
}

export async function getDropboxTemporaryLink(path: string): Promise<string> {
  const accessToken = await getAccessToken();

  const res = await fetch("https://api.dropboxapi.com/2/files/get_temporary_link", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });

  if (!res.ok) {
    throw new Error(`Dropbox 다운로드 링크 생성 실패: ${await res.text()}`);
  }

  const data = (await res.json()) as { link: string };
  return data.link;
}

export async function deleteFromDropbox(path: string): Promise<void> {
  const accessToken = await getAccessToken();

  const res = await fetch("https://api.dropboxapi.com/2/files/delete_v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });

  if (!res.ok) {
    throw new Error(`Dropbox 삭제 실패: ${await res.text()}`);
  }
}
