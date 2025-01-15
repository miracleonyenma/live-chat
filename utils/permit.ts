// ./utils/permit.ts

import permit from "@/lib/permit";

/**
 * Syncs a user with Permit.io and assigns roles.
 *
 * @param user - User details including id, first name, last name, and email.
 * @param role - Role to be assigned to the user for a specific resource.
 * @param resource_instance - Resource instance for which the role is assigned.
 * @returns Object containing the results of default and specific role assignments.
 */
const handleSyncUser = async ({
  user,
  role,
  resource_instance,
}: {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  role: string;
  resource_instance: string;
}) => {
  try {
    // Synchronize the user with Permit.io using their ID and basic information.
    const syncUser = await permit.api.syncUser({
      key: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      attributes: {}, // Add any custom attributes if needed.
    });

    // Assign a default role ("viewer") to the user for the default tenant.
    const assignDefaultRole = await permit.api.assignRole({
      role: "viewer",
      tenant: "default",
      user: syncUser.id,
    });

    // Assign a specific role to the user for a given resource instance.
    const assignRole = await permit.api.assignRole({
      role: role || "viewer", // Fallback to "viewer" if no role is provided.
      tenant: "default",
      user: syncUser.id,
      resource_instance,
    });

    return { assignRole, assignDefaultRole }; // Return role assignment results.
  } catch (error) {
    console.error("Error syncing user with Permit.io: ", error); // Log error details.
    return error; // Return error for further handling.
  }
};

/**
 * Retrieves a specific user's details from Permit.io using their ID.
 *
 * @param id - Unique identifier of the user.
 * @returns User details retrieved from Permit.io.
 */
const handleGetPermitUser = async (id: string) => {
  return await permit.api.getUser(id);
};

/**
 * Retrieves a list of all users managed by Permit.io.
 *
 * @returns List of users.
 */
const handleGetPermitUsers = async () => {
  return await permit.api.users.list();
};

/**
 * Retrieves a list of all resource instances managed by Permit.io.
 *
 * @returns List of resource instances.
 */
const handleListResourceInstances = async () => {
  return await permit.api.resourceInstances.list();
};

/**
 * Retrieves the roles assigned to a user by their user ID.
 *
 * @param userId - Unique identifier of the user.
 * @returns List of roles assigned to the user.
 */
const getUserRoles = async (userId: string) => {
  try {
    return await permit.api.getAssignedRoles(userId);
  } catch (error) {
    console.error("Error fetching user roles: ", error); // Log error details.
    return []; // Return an empty array for graceful error handling.
  }
};

export {
  handleGetPermitUser,
  handleSyncUser,
  handleGetPermitUsers,
  handleListResourceInstances,
  getUserRoles,
};
