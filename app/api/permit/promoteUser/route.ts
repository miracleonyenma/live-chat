// ./app/api/permit/promoteUser/route.ts

import { auth } from "@/auth"; // Import the authentication module.
import permit from "@/lib/permit"; // Import the Permit.io instance for API interactions.
import { handleListResourceInstances } from "@/utils/permit"; // Utility function to fetch resource instances.
import { NextRequest } from "next/server"; // Import the Next.js request object type.

/**
 * Promotes a user by assigning roles on specific resource instances.
 * @param data - An object containing userKey, channel, role, and modChannel.
 * @returns An object with the results of each role assignment operation.
 */
const promoteUser = async (data: {
  userKey: string;
  channel: string;
  role: string;
  modChannel: string;
}) => {
  // Retrieve the current user's key (e.g., email or unique identifier).
  const currentUserKey = (await auth())?.user?.email;
  if (!currentUserKey) throw new Error("User not found");

  // Check if the current user has permission to promote other users.
  const canPromoteUser = await permit.check(
    currentUserKey,
    "promote",
    "channel",
  );
  console.log("🟢 Can Promote User:", canPromoteUser);

  if (!canPromoteUser) throw new Error("Cannot promote user");

  // Assign the specified role to the user on the target channel.
  const assignToModRoleOnChannel = await permit.api.assignRole({
    role: data.role || "participant",
    tenant: "default",
    user: data.userKey,
    resource_instance: data.channel,
  });

  // Assign the "participant" role to the user on the moderation channel.
  const assignModChannelRole = await permit.api.assignRole({
    role: "participant",
    tenant: "default",
    user: data.userKey,
    resource_instance: data.modChannel,
  });

  // Assign the "admin" role to the user.
  const assignAdminRole = await permit.api.assignRole({
    role: "admin",
    tenant: "default",
    user: data.userKey,
  });

  // Return the results of each assignment operation.
  return { assignModChannelRole, assignToModRoleOnChannel, assignAdminRole };
};

export const GET = async (request: NextRequest) => {
  try {
    // Extract query parameters from the request.
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get("key"); // The user key (email or unique identifier).
    const channel = searchParams.get("channel")?.split(":")[1]; // Extract the channel identifier.

    // Validate that both the user key and channel are provided.
    if (!key || !channel) throw new Error("User key or channel not provided");

    // Fetch the list of resource instances from the Permit.io API.
    const resourceInstances = await handleListResourceInstances();

    // Find the specific resource instance for the given channel and the moderation channel.
    const resourceInstance = resourceInstances.find(
      (resource) => resource.key === channel,
    );
    const modChannel = resourceInstances.find(
      (resource) => resource.key === "mod",
    );

    // Ensure the resource instances for the channel and moderation channel exist.
    if (!resourceInstance?.id || !modChannel?.id) {
      throw new Error("Resource not found");
    }

    // Execute the promotion process.
    const res = await promoteUser({
      channel: resourceInstance.id,
      userKey: key,
      role: "moderator",
      modChannel: modChannel.id,
    });

    console.log("🟢 Promotion Result:", res);

    // Return the result as a JSON response.
    return new Response(JSON.stringify({ data: res }), {
      status: 200,
    });
  } catch (error) {
    // Log any errors that occur during the process.
    console.error("🔴 Error:", error);

    // Return the error message as a JSON response with a 400 status code.
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
    });
  }
};
