import { revalidatePath } from "next/cache";

export const revalidatePathUrl = (url: string = "/home-test") => {
  return revalidatePath(url);
};
