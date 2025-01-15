// ./app/api/permit/listResourceInstances/route.ts

import { handleListResourceInstances } from "@/utils/permit";

export const GET = async () => {
  const resourceInstances = await handleListResourceInstances();
  return Response.json(resourceInstances);
};
