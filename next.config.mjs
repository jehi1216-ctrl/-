/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // 기본 1MB로는 사진 첨부(Dropbox 업로드) 시 바로 초과되므로 넉넉히 설정
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
