export async function createSignedUpload<T>(
  sign: () => Promise<string>,
  persist: () => Promise<T>,
): Promise<{ uploadUrl: string; asset: T }> {
  const uploadUrl = await sign();
  const asset = await persist();
  return { uploadUrl, asset };
}
