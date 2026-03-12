import { revalidatePath } from "next/cache";

export const revalidatePathUrl = (url: string = "/chat") => {
  return revalidatePath(url);
};
