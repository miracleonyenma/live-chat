// ./app/api/permit/demoteUser/route.ts

import permit from "@/lib/permit"; // Import the Permit.io instance for API interactions.
import { handleListResourceInstances } from "@/utils/permit"; // Utility function to fetch resource instances.
import { NextRequest } from "next/server"; // Import the Next.js request object type.

/**
 * Demotes a user by unassigning roles on specific resource instances.
 * @param key - The user key (email or unique identifier).
 * @param currentChannel - The channel to unassign the "moderator" role from.
 * @returns An object with the status of each unassignment operation.
 */
const demoteUser = async (key: string, currentChannel: string) => {
  // Unassign the "participant" role on the moderation channel.
  const unassignModChannel = (
    await permit.api.unassignRole({
      role: "participant",
      tenant: "default",
      user: key,
      resource_instance: "channel:mod",
    })
  ).status;

  // Unassign the "moderator" role on the current channel.
  const unassignModRoleOnChannel = (
    await permit.api.unassignRole({
      role: "moderator",
      tenant: "default",
      user: key,
      resource_instance: currentChannel,
    })
  ).status;

  // Unassign the "admin" role from the user.
  const unassignAdminRole = (
    await permit.api.unassignRole({
      role: "admin",
      tenant: "default",
      user: key,
    })
  ).status;

  // Return the status of each unassignment operation.
  return {
    unassignModRoleOnChannel,
    unassignModChannel,
    unassignAdminRole,
  };
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

    // Retrieve the roles currently assigned to the user.
    const assignedRoles = await permit.api.getAssignedRoles(key);
    console.log("🟢 Assigned Roles:", assignedRoles);

    // Construct the current channel identifier in the required format.
    const currentChannel = `channel:${channel}`;
    console.log("🟢 Current Channel:", currentChannel);

    // Ensure the current channel is valid before proceeding.
    if (!currentChannel) throw new Error("Channel not found");

    // Execute the demotion process.
    const res = await demoteUser(key, currentChannel);

    console.log("🟢 Demotion Result:", res);

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
